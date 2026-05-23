import { createProduct } from "../../actions";
import { ProductForm } from "../../_components/ProductForm";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        {draft ? "New Draft" : "Add Product"}
      </h1>
      <ProductForm action={createProduct} initialPublished={draft !== "true"} />
    </div>
  );
}
