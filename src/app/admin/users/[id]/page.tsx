import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "../../actions";

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  shipped:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: me } } = await supabase.auth.getUser();

  type ProfileRow  = { id: string; full_name: string | null; role: string; created_at: string };
  type OrderRow    = { id: string; status: string; total: number; created_at: string };
  type AddressRow  = { id: string; label: string | null; full_name: string; line1: string; line2: string | null; city: string; state: string | null; postal_code: string | null; country: string; is_default: boolean };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileRes, ordersRes, addressesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at").eq("id", id).single(),
    supabase.from("orders").select("id, status, total, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("addresses").select("id, label, full_name, line1, line2, city, state, postal_code, country, is_default").eq("user_id", id).order("is_default", { ascending: false }) as any,
  ]);
  const profile   = profileRes.data as ProfileRow | null;
  const orders    = ordersRes.data as OrderRow[] | null;
  const addresses = addressesRes.data as AddressRow[] | null;

  if (!profile) notFound();

  const isMe = profile.id === me?.id;
  const totalSpent = (orders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Users</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{profile.full_name ?? "Unnamed"}</span>
      </div>

      <div className="space-y-4">
        {/* Profile card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {profile.full_name ?? "Unnamed user"}
                {isMe && <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Joined {new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              profile.role === "admin"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}>
              {profile.role}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm pt-1">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Orders</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{orders?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total spent</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {totalSpent > 0 ? `GH₵${totalSpent.toFixed(2)}` : "—"}
              </p>
            </div>
          </div>

          {!isMe && (
            <form action={updateUserRole.bind(null, profile.id, profile.role === "admin" ? "customer" : "admin")}>
              <button type="submit"
                className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                  profile.role === "admin"
                    ? "border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    : "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                }`}>
                {profile.role === "admin" ? "Remove admin access" : "Promote to admin"}
              </button>
            </form>
          )}
        </div>

        {/* Addresses */}
        {addresses && addresses.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Saved addresses ({addresses.length})</p>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {addresses.map((addr) => (
                <li key={addr.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{addr.full_name}</p>
                        {addr.label && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-medium uppercase tracking-wide">{addr.label}</span>
                        )}
                        {addr.is_default && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded font-medium">Default</span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-gray-500 dark:text-gray-400">{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}</p>
                      {addr.country !== "GH" && <p className="text-gray-500 dark:text-gray-400">{addr.country}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Orders */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Orders ({orders?.length ?? 0})
            </p>
            {(orders?.length ?? 0) > 0 && (
              <Link href={`/admin/orders?user=${profile.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </Link>
            )}
          </div>
          {orders?.length ? (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[o.status] ?? ""}`}>
                      {o.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">GH₵{o.total.toFixed(2)}</span>
                    <Link href={`/admin/orders/${o.id}`}
                      className="px-3 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
