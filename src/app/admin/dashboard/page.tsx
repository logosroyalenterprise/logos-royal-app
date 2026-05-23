import { createClient } from "@/lib/supabase/server";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  shipped:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded:   "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { data: orders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total"),
    supabase.from("orders")
      .select("id, status, total, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenue = (orders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Total Revenue" value={`GH₵${revenue.toFixed(2)}`} />
        <StatCard label="Orders" value={orderCount ?? 0} />
        <StatCard label="Products" value={productCount ?? 0} />
        <StatCard label="Users" value={userCount ?? 0} />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-120">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders ?? []).map((o) => (
                <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[o.status] ?? ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">GH₵{o.total.toFixed(2)}</td>
                </tr>
              ))}
              {!recentOrders?.length && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
