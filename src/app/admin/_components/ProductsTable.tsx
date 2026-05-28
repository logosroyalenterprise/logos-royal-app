"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteProduct, bulkDeleteProducts, bulkSetPublished } from "../actions";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  in_stock: boolean;
  stock_count: number;
  published: boolean;
  rating: number;
  review_count: number;
};

function StockBadge({ count, inStock }: { count: number; inStock: boolean }) {
  if (!inStock || count === 0)
    return <span className="text-sm font-semibold text-red-500 dark:text-red-400">0</span>;
  if (count <= 5)
    return <span className="text-sm font-semibold text-amber-500 dark:text-amber-400">{count}</span>;
  return <span className="text-sm font-semibold text-green-600 dark:text-green-400">{count}</span>;
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
      published
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    }`}>
      {published ? "Live" : "Draft"}
    </span>
  );
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = products.length > 0 && selected.size === products.length;
  const toggle = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));

  const runBulk = (action: (ids: string[]) => Promise<void>) => {
    startTransition(async () => {
      await action(Array.from(selected));
      setSelected(new Set());
    });
  };

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
          <span className="font-medium text-blue-700 dark:text-blue-300">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              disabled={pending}
              onClick={() => runBulk((ids) => bulkSetPublished(ids, true))}
              className="px-3 py-1.5 text-xs font-medium border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors disabled:opacity-50"
            >
              Publish
            </button>
            <button
              disabled={pending}
              onClick={() => runBulk((ids) => bulkSetPublished(ids, false))}
              className="px-3 py-1.5 text-xs font-medium border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors disabled:opacity-50"
            >
              Draft
            </button>
            <button
              disabled={pending}
              onClick={() => {
                if (!confirm(`Delete ${selected.size} product${selected.size > 1 ? "s" : ""}?`)) return;
                runBulk(bulkDeleteProducts);
              }}
              className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Stock qty</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-gray-50 dark:border-gray-800/50 transition-colors ${
                  selected.has(p.id) ? "bg-blue-50/50 dark:bg-blue-950/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  ${p.price.toFixed(2)} USD
                </td>
                <td className="px-4 py-3 text-center">
                  <StockBadge count={p.stock_count} inStock={p.in_stock} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge published={p.published} />
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                  {p.rating} <span className="text-gray-400">({p.review_count})</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/products/${p.id}/edit`}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      Edit
                    </Link>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button
                        type="submit"
                        onClick={(e) => { if (!confirm(`Delete "${p.name}"?`)) e.preventDefault(); }}
                        className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                  No products — add one above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {products.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No products — add one above</p>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            className={`bg-white dark:bg-gray-900 border rounded-xl p-4 transition-colors ${
              selected.has(p.id)
                ? "border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/10"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 leading-snug">{p.name}</p>
                  <StatusBadge published={p.published} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{p.category}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">${p.price.toFixed(2)} USD</span>
                  <span className="text-gray-400 text-xs">Stock: <StockBadge count={p.stock_count} inStock={p.in_stock} /></span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link href={`/admin/products/${p.id}/edit`}
                className="flex-1 text-center py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Edit
              </Link>
              <form action={deleteProduct.bind(null, p.id)} className="flex-1">
                <button
                  type="submit"
                  onClick={(e) => { if (!confirm(`Delete "${p.name}"?`)) e.preventDefault(); }}
                  className="w-full py-1.5 text-xs font-medium border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
