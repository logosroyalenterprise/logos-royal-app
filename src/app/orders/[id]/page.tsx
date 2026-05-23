import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  shipped:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  type OrderRow = { id: string; status: string; total: number; subtotal: number; shipping: number; created_at: string; shipping_address_id: string | null };
  type ItemRow  = { id: string; product_id: string | null; product_name: string; product_img: string | null; quantity: number; unit_price: number; color: string | null; size: string | null };
  type AddrRow  = { full_name: string; line1: string; line2: string | null; city: string; state: string | null; postal_code: string | null; country: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("id, status, total, subtotal, shipping, created_at, shipping_address_id").eq("id", id).eq("user_id", user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("order_items").select("id, product_id, product_name, product_img, quantity, unit_price, color, size").eq("order_id", id) as any),
  ]);

  const order = orderRes.data as OrderRow | null;
  const orderItems = (itemsRes.data ?? []) as ItemRow[];

  if (!order) notFound();

  let address: AddrRow | null = null;
  if (order.shipping_address_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("addresses").select("full_name, line1, line2, city, state, postal_code, country").eq("id", order.shipping_address_id).single() as any);
    address = data as AddrRow | null;
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-6 sm:px-8 lg:px-12 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/orders" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Orders</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>

          <div className="space-y-4">

            {/* Status header */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[order.status] ?? ""}`}>
                  {order.status}
                </span>
              </div>

              {/* Progress tracker (only for non-cancelled/refunded) */}
              {stepIndex >= 0 && (
                <div className="flex items-center gap-0 mt-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex-1 flex items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 transition-colors ${
                        i <= stepIndex ? "bg-blue-600 dark:bg-blue-400" : "bg-gray-200 dark:bg-gray-700"
                      }`} />
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 transition-colors ${
                          i < stepIndex ? "bg-blue-600 dark:bg-blue-400" : "bg-gray-200 dark:bg-gray-700"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {stepIndex >= 0 && (
                <div className="flex justify-between mt-1">
                  {STATUS_STEPS.map((step) => (
                    <p key={step} className="text-[10px] text-gray-400 capitalize">{step}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Items</p>
              </div>
              <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                {orderItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {item.product_img ? (
                      <div className="shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800" style={{ width: 56, height: 56 }}>
                        <img
                          src={item.product_img}
                          alt={item.product_name}
                          style={{ width: 56, height: 56, objectFit: "cover", display: "block" }}
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800" style={{ width: 56, height: 56 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{item.product_name}</p>
                      {(item.color || item.size) && (
                        <p className="text-xs text-gray-400 mt-0.5">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                      GH₵{(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>GH₵{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{Number(order.shipping) === 0 ? "Free" : `GH₵${Number(order.shipping).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-gray-100 pt-1">
                  <span>Total</span>
                  <span>GH₵{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {address && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Shipping to</p>
                </div>
                <div className="px-5 py-4 text-sm space-y-0.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{address.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p className="text-gray-500 dark:text-gray-400">{[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}</p>
                  {address.country !== "GH" && <p className="text-gray-500 dark:text-gray-400">{address.country}</p>}
                </div>
              </div>
            )}

          </div>

          <Link href="/" className="mt-6 inline-block px-6 py-2.5 text-sm font-semibold rounded-full bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 active:scale-[0.98] transition-all">
            Continue shopping
          </Link>
        </div>
      </main>
    </>
  );
}
