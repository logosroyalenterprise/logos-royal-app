import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "../actions";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
    supabase.from("orders").select("user_id, total"),
  ]);

  const orderStats = new Map<string, { count: number; spent: number }>();
  for (const o of orders ?? []) {
    if (!o.user_id) continue;
    const s = orderStats.get(o.user_id) ?? { count: 0, spent: 0 };
    orderStats.set(o.user_id, { count: s.count + 1, spent: s.spent + (o.total ?? 0) });
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Users</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-140">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Orders</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Total spent</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => {
                const isMe = p.id === me?.id;
                const stats = orderStats.get(p.id) ?? { count: 0, spent: 0 };
                return (
                  <tr id={p.id} key={p.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3">
                      <Link href={`/admin/users/${p.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {p.full_name ?? "Unnamed user"}
                      </Link>
                      {isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        p.role === "admin"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                      {stats.count > 0 ? stats.count : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {stats.spent > 0 ? `GH₵${stats.spent.toFixed(2)}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isMe && (
                        <form action={updateUserRole.bind(null, p.id, p.role === "admin" ? "customer" : "admin")}>
                          <button type="submit"
                            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors whitespace-nowrap ${
                              p.role === "admin"
                                ? "border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                : "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            }`}>
                            {p.role === "admin" ? "Remove admin" : "Make admin"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!profiles?.length && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
