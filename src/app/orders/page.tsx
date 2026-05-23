import { Header } from "@/components/Header";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  shipped:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-base font-semibold">Sign in to view your orders</p>
          <Link href="/signin" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Sign in
          </Link>
        </main>
      </>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-10">My Orders</h1>

        {orders?.length ? (
          <div className="max-w-2xl flex flex-col gap-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl [box-shadow:0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[o.status] ?? ""}`}>
                    {o.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">GH₵{Number(o.total).toFixed(2)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            ))}
            <Link href="/" className="mt-4 self-start px-6 py-2.5 text-sm font-semibold rounded-full bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 active:scale-[0.98] transition-all">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-24">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300 dark:text-blue-700">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">No orders yet</p>
              <p className="text-sm text-gray-500 mt-1">Your order history will show up here</p>
            </div>
            <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
              Start shopping
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
