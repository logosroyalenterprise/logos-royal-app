import Link from "next/link";
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

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { user: filterUserId } = await searchParams;
  const supabase = await createClient();

  let ordersQuery = supabase.from("orders")
    .select("id, status, total, subtotal, shipping, created_at, user_id")
    .order("created_at", { ascending: false });
  if (filterUserId) ordersQuery = ordersQuery.eq("user_id", filterUserId);

  const [{ data: orders }, { data: profiles }, itemsRes] = await Promise.all([
    ordersQuery,
    supabase.from("profiles").select("id, full_name"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("order_items").select("order_id") as any),
  ]);
  const typedItems: { order_id: string }[] = (itemsRes as any)?.data ?? [];

  const nameMap = new Map<string, string>(
    (profiles as { id: string; full_name: string }[] | null)?.map((p) => [p.id, p.full_name ?? ""]) ?? []
  );
  const itemCountMap = new Map<string, number>();
  for (const item of typedItems) {
    itemCountMap.set(item.order_id, (itemCountMap.get(item.order_id) ?? 0) + 1);

  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Orders</h1>
        {filterUserId && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Customer: <span className="font-medium text-gray-900 dark:text-gray-100">{nameMap.get(filterUserId) ?? "Unknown"}</span></span>
            <Link href="/admin/orders" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear</Link>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Items</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3">
                    {o.user_id && nameMap.get(o.user_id)
                      ? <Link href={`/admin/users#${o.user_id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{nameMap.get(o.user_id)}</Link>
                      : <span className="text-gray-400">Guest</span>
                    }
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[o.status] ?? ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {itemCountMap.get(o.id) ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                    GH₵{o.total.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
