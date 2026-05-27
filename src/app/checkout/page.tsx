"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { useUserData } from "@/context/UserDataContext";
import { ALL_PRODUCTS, mapDbToProduct, type Product } from "@/data/products";
import { initializePayment } from "./actions";
import { sanitizeCountry } from "@/lib/geo";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const CA_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];
const AU_STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];

function getRegionMeta(country: string | null): { label: string; placeholder: string; options: string[] | null } {
  switch (country?.toUpperCase()) {
    case "US": return { label: "State", placeholder: "Select state", options: US_STATES };
    case "CA": return { label: "Province", placeholder: "Select province", options: CA_PROVINCES };
    case "AU": return { label: "State", placeholder: "Select state", options: AU_STATES };
    default:   return { label: "Region", placeholder: "Greater Accra", options: null };
  }
}

interface BagItem {
  id: string;
  product_id: string;
  quantity: number;
  color: string | null;
  size: string | null;
}

interface Address {
  id: string;
  label: string | null;
  full_name: string;
  line1: string;
  city: string;
  state: string | null;
  is_default: boolean;
}

function CheckoutInner() {
  const searchParams = useSearchParams();
  const { user } = useUserData();
  const [items, setItems] = useState<BagItem[]>([]);
  const [dbProductsMap, setDbProductsMap] = useState<Record<string, Product>>({});
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [newAddr, setNewAddr] = useState({ full_name: "", line1: "", city: "", state: "", postal_code: "" });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(
    () => searchParams.get("payment_error") ? decodeURIComponent(searchParams.get("payment_error")!) : null
  );
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [shippingFees, setShippingFees] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)user-country=([^;]+)/);
    setUserCountry(
      sanitizeCountry(match ? decodeURIComponent(match[1]) : null) ??
      sanitizeCountry(process.env.NEXT_PUBLIC_GEO_TEST_COUNTRY ?? null)
    );
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const supabase = createClient();
    const staticIds = new Set(ALL_PRODUCTS.map((p) => p.id));
    const missing = [...new Set(items.map((i) => i.product_id))].filter((id) => !staticIds.has(id));
    if (!missing.length) return;
    setEnrichmentLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("products").select("id, name, category, sub_category, price, img, images, in_stock, description, colors, sizes, highlights, attrs, rating, review_count").in("id", missing) as any)
      .then(({ data }: { data: unknown[] | null }) => {
        if (data) setDbProductsMap(Object.fromEntries((data as Parameters<typeof mapDbToProduct>[0][]).map((p) => [p.id, mapDbToProduct(p)])));
        setEnrichmentLoading(false);
      });
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || items.length === 0) return;
    const supabase = createClient();
    const ids = [...new Set(items.map((i) => i.product_id))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("products").select("id, shipping_fee").in("id", ids) as any)
      .then(({ data }: { data: { id: string; shipping_fee: number | null }[] | null }) => {
        if (!data) return;
        setShippingFees(new Map(data.map((p) => [p.id, Number(p.shipping_fee ?? 0)])));
      });
  }, [user, items]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    Promise.all([
      supabase.from("bag_items").select("id, product_id, quantity, color, size").eq("user_id", user.id).order("created_at"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("addresses").select("id, label, full_name, line1, city, state, is_default").eq("user_id", user.id).order("is_default", { ascending: false }) as any),
    ]).then(([bagRes, addrRes]) => {
      setItems(bagRes.data ?? []);
      const addrs = (addrRes.data ?? []) as Address[];
      setAddresses(addrs);
      if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
      setLoading(false);
    });
  }, [user]);

  const enriched = items.map((item) => ({
    ...item,
    product: ALL_PRODUCTS.find((p) => p.id === item.product_id) ?? dbProductsMap[item.product_id],
  })).filter((i) => i.product);

  const subtotal = enriched.reduce((sum, i) => {
    const price = parseFloat(i.product!.price.replace(/[^0-9.]/g, ""));
    return sum + price * i.quantity;
  }, 0);

  const shippingTotal = enriched.reduce((sum, i) => {
    return sum + (shippingFees.get(i.product_id) ?? 0) * i.quantity;
  }, 0);

  const grandTotal = subtotal + shippingTotal;

  const addressValid =
    selectedAddressId !== "new" ||
    (newAddr.full_name.trim() && newAddr.line1.trim() && newAddr.city.trim());

  async function handlePay() {
    if (!user?.email || !addressValid || paying) return;
    setError(null);
    setPaying(true);

    try {
      const ref = `LR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const { authorizationUrl } = await initializePayment(
        user.email,
        Math.round(grandTotal * 100),
        ref,
        `${window.location.origin}/checkout/callback`,
        selectedAddressId === "new" ? null : selectedAddressId,
        selectedAddressId === "new" ? newAddr : null,
      );

      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment. Please try again.");
      setPaying(false);
    }
  }

  if (loading || enrichmentLoading) {
    return (
      <>
        <Header />
        <main className="pt-28 min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-300 border-t-blue-950 animate-spin" />
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-base font-semibold">Sign in to checkout</p>
          <Link href="/signin" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Sign in
          </Link>
        </main>
      </>
    );
  }

  if (enriched.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-base font-semibold">Your bag is empty</p>
          <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Shop now
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-6 sm:px-8 lg:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/bag" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Bag</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Checkout</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left: Address */}
            <div className="flex-1 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Shipping address</h2>

                {addresses.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {addresses.map((addr) => (
                      <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}>
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-0.5 accent-blue-600"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {addr.full_name}
                            {addr.label && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded font-medium uppercase tracking-wide">{addr.label}</span>}
                            {addr.is_default && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded font-medium">Default</span>}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 mt-0.5">{addr.line1}</p>
                          <p className="text-gray-500 dark:text-gray-400">{[addr.city, addr.state].filter(Boolean).join(", ")}</p>
                        </div>
                      </label>
                    ))}

                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedAddressId === "new"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}>
                      <input
                        type="radio"
                        name="address"
                        value="new"
                        checked={selectedAddressId === "new"}
                        onChange={() => setSelectedAddressId("new")}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use a different address</span>
                    </label>
                  </div>
                )}

                {selectedAddressId === "new" && (() => {
                  const region = getRegionMeta(userCountry);
                  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full name</label>
                        <input type="text" value={newAddr.full_name} onChange={(e) => setNewAddr((p) => ({ ...p, full_name: e.target.value }))} placeholder="Ama Mensah" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Street address</label>
                        <input type="text" value={newAddr.line1} onChange={(e) => setNewAddr((p) => ({ ...p, line1: e.target.value }))} placeholder="14 Cantonments Road" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">City</label>
                          <input type="text" value={newAddr.city} onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))} placeholder="Accra" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {region.label}{!region.options && " (optional)"}
                          </label>
                          {region.options ? (
                            <select
                              value={newAddr.state}
                              onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))}
                              className={inputCls}
                            >
                              <option value="">{region.placeholder}</option>
                              {region.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type="text" value={newAddr.state} onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))} placeholder={region.placeholder} className={inputCls} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Items summary on mobile */}
              <div className="lg:hidden bg-white dark:bg-gray-900 rounded-2xl p-6 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Order summary</h2>
                <div className="space-y-3">
                  {enriched.map(({ id, product, quantity, color, size }) => (
                    <div key={id} className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 shrink-0 rounded-xl overflow-hidden ${product!.bg}`}>
                        {product!.img && <Image src={product!.img} alt={product!.name} fill className="object-cover" sizes="48px" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{product!.name}</p>
                        {(color || size) && <p className="text-xs text-gray-400">{[color, size].filter(Boolean).join(" · ")}</p>}
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        GH₵{(parseFloat(product!.price.replace(/[^0-9.]/g, "")) * quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span><span>GH₵{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span>{shippingTotal > 0 ? `GH₵${shippingTotal.toFixed(2)}` : <span className="text-emerald-600 dark:text-emerald-400">Free</span>}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1">
                    <span>Total</span><span>GH₵{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order summary + pay */}
            <div className="lg:w-72 shrink-0">
              <div className="sticky top-28 space-y-4">
                {/* Items list desktop */}
                <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl p-6 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Order ({enriched.length} {enriched.length === 1 ? "item" : "items"})</h2>
                  <div className="space-y-3">
                    {enriched.map(({ id, product, quantity, color, size }) => (
                      <div key={id} className="flex items-center gap-3">
                        <div className={`relative w-10 h-10 shrink-0 rounded-lg overflow-hidden ${product!.bg}`}>
                          {product!.img && <Image src={product!.img} alt={product!.name} fill className="object-cover" sizes="40px" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{product!.name}</p>
                          {(color || size) && <p className="text-[10px] text-gray-400">{[color, size].filter(Boolean).join(" · ")}</p>}
                          <p className="text-xs text-gray-500">Qty {quantity}</p>
                        </div>
                        <p className="text-xs font-semibold shrink-0">
                          GH₵{(parseFloat(product!.price.replace(/[^0-9.]/g, "")) * quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>GH₵{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span>
                      <span>{shippingTotal > 0 ? `GH₵${shippingTotal.toFixed(2)}` : <span className="text-emerald-600 dark:text-emerald-400">Free</span>}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100 pt-1">
                      <span>Total</span>
                      <span>GH₵{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Pay button */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)] space-y-3">
                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">{error}</p>
                  )}
                  <button
                    onClick={handlePay}
                    disabled={paying || !addressValid}
                    className="w-full py-3 bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 text-sm font-semibold rounded-full active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Redirecting to Paystack...
                      </>
                    ) : (
                      `Pay GH₵${grandTotal.toFixed(2)}`
                    )}
                  </button>
                  <p className="text-center text-[11px] text-gray-400">Secured by Paystack</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
