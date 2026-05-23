import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "../../actions";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  shipped:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  type ItemRow = { id: string; product_id: string | null; product_name: string; product_img: string | null; quantity: number; unit_price: number; color: string | null; size: string | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: orderRaw }, itemsRes] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items")
      .select("id, product_id, product_name, product_img, quantity, unit_price, color, size")
      .eq("order_id", id)
      .order("id") as any,
  ]);
  const items: ItemRow[] | null = itemsRes.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderRaw as any;
  if (!order) notFound();

  const { data: customer } = order.user_id
    ? await supabase.from("profiles").select("id, full_name").eq("id", order.user_id).single()
    : { data: null };

  type AddressRow = { full_name: string; line1: string; line2: string | null; city: string; state: string | null; postal_code: string | null; country: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const address: AddressRow | null = order.shipping_address_id
    ? ((await supabase.from("addresses").select("full_name, line1, line2, city, state, postal_code, country").eq("id", order.shipping_address_id).single()) as any).data
    : null;

  const action = updateOrderStatus.bind(null, id);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/orders" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Orders</a>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">#{id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Order #{id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(order.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[order.status] ?? ""}`}>{order.status}</span>
          </div>

          {customer && (
            <div className="text-sm">
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              <Link href={`/admin/users/${customer.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {customer.full_name ?? "Unnamed"}
              </Link>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm pt-1">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Subtotal</p>
              <p className="font-medium">GH₵{order.subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Shipping</p>
              <p className="font-medium">GH₵{order.shipping.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total</p>
              <p className="font-semibold text-blue-950 dark:text-blue-200">GH₵{order.total.toFixed(2)}</p>
            </div>
          </div>

          {order.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Shipping address */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Deliver to</p>
          {address ? (
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{address.full_name}</p>
              <p className="text-gray-600 dark:text-gray-400">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
              <p className="text-gray-600 dark:text-gray-400">{[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}</p>
              {address.country && address.country !== "GH" && (
                <p className="text-gray-600 dark:text-gray-400">{address.country}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No shipping address on this order.</p>
          )}
        </div>

        {/* Line items */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Items ({items?.length ?? 0})
            </p>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {(items ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                {/* Thumbnail */}
                <div className="shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700" style={{ width: 48, height: 48 }}>
                  {item.product_img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.product_img} alt={item.product_name} width={48} height={48} style={{ width: 48, height: 48, objectFit: "cover", display: "block" }} />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-4 4 4"/><path d="M3 15h18"/></svg>
                      </div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {item.product_id
                    ? <Link href={`/admin/products/${item.product_id}/edit`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                        {item.product_name}
                      </Link>
                    : <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{item.product_name}</p>
                  }
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {item.size && (
                      <span className="text-xs text-gray-400">Size: <span className="text-gray-600 dark:text-gray-300">{item.size}</span></span>
                    )}
                    {item.color && (
                      <span className="text-xs text-gray-400">Color: <span className="text-gray-600 dark:text-gray-300">{item.color}</span></span>
                    )}
                  </div>
                </div>

                {/* Qty + price */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    GH₵{(item.unit_price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × GH₵{item.unit_price.toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
            {!items?.length && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">No items found</li>
            )}
          </ul>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <form key={s} action={action}>
                <input type="hidden" name="status" value={s} />
                <button type="submit"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    order.status === s
                      ? "bg-blue-950 text-white dark:bg-blue-200 dark:text-blue-950 cursor-default"
                      : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  disabled={order.status === s}
                >
                  {s}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
