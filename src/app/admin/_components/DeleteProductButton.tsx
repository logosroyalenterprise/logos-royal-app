"use client";

import { deleteProduct } from "../actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteProduct.bind(null, id)}>
      <button
        type="submit"
        onClick={(e) => { if (!confirm(`Delete "${name}"?`)) e.preventDefault(); }}
        className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
