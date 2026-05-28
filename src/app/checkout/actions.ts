"use server";

import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/email";

interface NewAddress {
  full_name: string;
  line1: string;
  city: string;
  state?: string;
  postal_code?: string;
}

export async function initializePayment(
  email: string,
  amountKobo: number,
  reference: string,
  callbackUrl: string,
  addressId: string | null,
  newAddress: NewAddress | null,
): Promise<{ authorizationUrl: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not set.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        currency: "GHS",
        callback_url: callbackUrl,
        metadata: {
          address_id: addressId ?? null,
          new_address: newAddress ? JSON.stringify(newAddress) : null,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Payment initialization timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message ?? "Failed to initialize payment.");
  return { authorizationUrl: json.data.authorization_url as string };
}

export async function confirmOrder(reference: string): Promise<{ orderId: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not set in environment.");

  // 1. Verify payment with Paystack
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  let verifyRes: Response;
  try {
    verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` }, cache: "no-store", signal: controller.signal },
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Payment verification timed out. If charged, contact support with your reference.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  const verifyJson = await verifyRes.json();
  if (!verifyRes.ok || verifyJson.data?.status !== "success") {
    throw new Error("Payment could not be verified. If charged, contact support.");
  }

  // 2. Read address from metadata embedded during initialize
  const meta = verifyJson.data?.metadata ?? {};
  const addressId: string | null = meta.address_id ?? null;
  let newAddress: NewAddress | null = null;
  if (meta.new_address) {
    try { newAddress = JSON.parse(meta.new_address); } catch { /* ignore */ }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  // 3. Resolve shipping address
  let shippingAddressId: string | null = addressId;
  if (!shippingAddressId && newAddress) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addrQ = supabase.from("addresses") as any;
    const { data: addr, error: addrErr } = await addrQ
      .insert({
        user_id: user.id,
        full_name: newAddress.full_name,
        line1: newAddress.line1,
        city: newAddress.city,
        state: newAddress.state ?? null,
        postal_code: newAddress.postal_code ?? null,
        country: "GH",
      })
      .select("id")
      .single();
    if (addrErr) throw new Error(addrErr.message);
    shippingAddressId = (addr as { id: string }).id;
  }

  // 4. Fetch bag items
  const { data: bagItems, error: bagErr } = await supabase
    .from("bag_items")
    .select("product_id, quantity, color, size")
    .eq("user_id", user.id);
  if (bagErr) throw new Error(bagErr.message);
  if (!bagItems?.length) throw new Error("Bag is empty.");

  // 5. Fetch product data from Supabase (authoritative prices)
  const productIds = [...new Set(bagItems.map((i) => i.product_id))];
  type ProductRow = { id: string; name: string; price: number; img: string | null; shipping_fee: number | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsQ = supabase.from("products") as any;
  const { data: products } = await productsQ.select("id, name, price, img, shipping_fee").in("id", productIds);
  const productMap = new Map<string, ProductRow>((products ?? []).map((p: ProductRow) => [p.id, p]));

  // 6. Build order items + totals
  let subtotal = 0;
  let shipping = 0;
  const orderItemsData = bagItems.map((item) => {
    const p = productMap.get(item.product_id ?? "");
    const unitPrice = p ? Number(p.price) : 0;
    subtotal += unitPrice * item.quantity;
    shipping += (Number(p?.shipping_fee ?? 0)) * item.quantity;
    return {
      product_id: item.product_id,
      product_name: p?.name ?? item.product_id ?? "Unknown product",
      product_img: p?.img ?? null,
      quantity: item.quantity,
      unit_price: unitPrice,
      color: item.color ?? null,
      size: item.size ?? null,
    };
  });

  // 7. Create order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersQ = supabase.from("orders") as any;
  const { data: order, error: orderErr } = await ordersQ
    .insert({
      user_id: user.id,
      status: "confirmed",
      shipping_address_id: shippingAddressId,
      subtotal,
      shipping,
      total: subtotal + shipping,
    })
    .select("id")
    .single();
  if (orderErr) throw new Error(orderErr.message);

  const orderId = (order as { id: string }).id;

  // 8. Create order items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemsQ = supabase.from("order_items") as any;
  const { error: itemsErr } = await itemsQ
    .insert(orderItemsData.map((i: typeof orderItemsData[0]) => ({ ...i, order_id: orderId })));
  if (itemsErr) throw new Error(`Order items failed: ${itemsErr.message}`);

  // Increment buy_count per product (fire-and-forget — non-fatal)
  void Promise.all(
    orderItemsData.map((i: { product_id: string; quantity: number }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.rpc as any)("increment_buy_count", { p_id: i.product_id, amount: i.quantity })
    )
  );

  // 9. Clear bag
  await supabase.from("bag_items").delete().eq("user_id", user.id);

  // 10. Send confirmation email (fire-and-forget — never block checkout on email failure)
  void (async () => {
    try {
      let address = null;
      if (shippingAddressId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("addresses") as any)
          .select("full_name, line1, line2, city, state, postal_code, country")
          .eq("id", shippingAddressId)
          .single();
        address = data;
      }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://logosroyal.com";
      await sendOrderConfirmation({
        to: user.email!,
        orderId,
        orderRef: orderId.slice(0, 8).toUpperCase(),
        items: orderItemsData,
        subtotal,
        shipping,
        total: subtotal + shipping,
        address,
        orderUrl: `${appUrl}/orders/${orderId}`,
      });
    } catch {
      // email failure is non-fatal
    }
  })();

  return { orderId };
}
