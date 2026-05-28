import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "../_components/ProductsTable";

export default async function ProductsPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false }) as any);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Products</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new?draft=true"
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            New Draft
          </Link>
          <Link href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 text-sm font-medium rounded-lg hover:bg-blue-900 dark:hover:bg-blue-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add product
          </Link>
        </div>
      </div>

      <ProductsTable products={products ?? []} />
    </div>
  );
}
