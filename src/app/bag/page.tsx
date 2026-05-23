"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { useUserData } from "@/context/UserDataContext";
import { ALL_PRODUCTS } from "@/data/products";

interface BagItem {
  id: string;
  product_id: string;
  quantity: number;
  color: string | null;
  size: string | null;
}

export default function BagPage() {
  const router = useRouter();
  const { user, refreshBag } = useUserData();
  const [items, setItems] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  async function fetchItems() {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("bag_items")
      .select("id, product_id, quantity, color, size")
      .eq("user_id", user.id)
      .order("created_at");
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateQty(id: string, delta: number, current: number) {
    const next = current + delta;
    if (next < 1) {
      await supabase.from("bag_items").delete().eq("id", id).eq("user_id", user!.id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      await supabase.from("bag_items").update({ quantity: next }).eq("id", id).eq("user_id", user!.id);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: next } : i));
    }
    refreshBag();
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("bag_items").delete().eq("id", id).eq("user_id", user!.id);
    refreshBag();
  }

  const enriched = items.map((item) => ({
    ...item,
    product: ALL_PRODUCTS.find((p) => p.id === item.product_id),
  })).filter((i) => i.product);

  const subtotal = enriched.reduce((sum, i) => {
    const price = parseFloat(i.product!.price.replace(/[^0-9.]/g, ""));
    return sum + price * i.quantity;
  }, 0);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 lg:px-12 min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-300 border-t-blue-950 animate-spin" />
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-base font-semibold">Sign in to view your bag</p>
          <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Browse products
          </Link>
        </main>
      </>
    );
  }

  if (enriched.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-12">Bag</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-24">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300 dark:text-blue-700">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">Your bag is empty</p>
              <p className="text-sm text-gray-500 mt-1">Add something to get started</p>
            </div>
            <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
              Shop now
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-6 sm:px-8 lg:px-12 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-10">
          Bag{enriched.length > 0 && <span className="text-gray-400 font-normal text-xl ml-2">({enriched.length})</span>}
        </h1>

        <div className="max-w-4xl flex flex-col lg:flex-row gap-10">

          {/* Items list */}
          <div className="flex-1 flex flex-col gap-4">
            {enriched.map(({ id, product, quantity, color, size }) => (
              <div key={id} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                <button
                  onClick={() => router.push(`/product/${product!.id}`)}
                  className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden ${product!.bg}`}
                >
                  <Image src={product!.img} alt={product!.name} fill className="object-cover" sizes="80px" />
                </button>

                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => router.push(`/product/${product!.id}`)}
                      className="text-sm font-semibold leading-snug line-clamp-2 text-left hover:underline"
                    >
                      {product!.name}
                    </button>
                    <button
                      onClick={() => removeItem(id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      aria-label="Remove"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  {(color || size) && (
                    <p className="text-xs text-gray-400">
                      {[color, size].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-1 py-0.5">
                      <button
                        onClick={() => updateQty(id, -1, quantity)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors text-sm font-bold"
                        aria-label="Decrease"
                      >−</button>
                      <span className="text-sm font-semibold w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQty(id, 1, quantity)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors text-sm font-bold"
                        aria-label="Increase"
                      >+</button>
                    </div>
                    <p className="text-sm font-bold">
                      GH₵{(parseFloat(product!.price.replace(/[^0-9.]/g, "")) * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-28 p-6 rounded-2xl bg-white dark:bg-gray-900 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <h2 className="text-base font-semibold">Order summary</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>GH₵{subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full py-3 bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 text-sm font-semibold rounded-full active:scale-[0.98] transition-all text-center"
              >
                Checkout
              </button>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
