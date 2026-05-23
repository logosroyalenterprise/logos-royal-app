import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../../../actions";
import { ProductForm } from "../../../_components/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product } = await supabase.from("products").select("*").eq("id", id).single() as any;
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Edit Product</h1>
      <ProductForm
        action={action}
        initial={{
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          price: product.price,
          category: product.category,
          sub_category: product.sub_category ?? "",
          in_stock: product.in_stock,
          img: product.img,
          images: product.images,
          sizes: product.sizes,
          highlights: product.highlights,
          colors: product.colors as { name: string; hex: string }[] | null,
          restricted_countries: product.restricted_countries as string[] | null,
          shipping_fee: product.shipping_fee as number | null,
        }}
        initialPublished={product.published ?? true}
        submitLabel="Update Product"
      />
    </div>
  );
}
