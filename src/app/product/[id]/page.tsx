import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { ALL_PRODUCTS, type Product, mapDbToProduct } from "@/data/products";
import { ProductDetail } from "@/components/ProductDetail";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { isAccessible, sanitizeCountry } from "@/lib/geo";

// force-dynamic so headers() works — needed for geo check on every request
export const dynamic = "force-dynamic";

async function resolveProduct(id: string, supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>): Promise<Product | null> {
  const static_ = ALL_PRODUCTS.find((p) => p.id === id);
  if (static_) return static_;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("products") as any)
    .select("id, name, category, sub_category, price, img, images, in_stock, description, colors, sizes, highlights, attrs")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  return data ? mapDbToProduct(data) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = ALL_PRODUCTS.find((p) => p.id === id);
  if (!product) return {};
  return {
    title: `${product.name} | Logos Royal`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Logos Royal`,
      description: product.description,
      images: [{ url: product.img }],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await resolveProduct(id, supabase);
  if (!product) notFound();

  const cookieStore = await cookies();
  const preferredLocation = sanitizeCountry(cookieStore.get("preferred-location")?.value ?? null);
  const userCountry =
    preferredLocation ??
    sanitizeCountry((await headers()).get("x-user-country")) ??
    sanitizeCountry(process.env.NEXT_PUBLIC_GEO_TEST_COUNTRY ?? null) ??
    sanitizeCountry(process.env.GEO_TEST_COUNTRY ?? null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dbProduct } = await (supabase
    .from("products")
    .select("restricted_countries")
    .eq("id", id)
    .maybeSingle() as any);

  const restricted: string[] | null = dbProduct?.restricted_countries ?? null;

  if (!isAccessible(restricted, userCountry)) {
    return (
      <>
        <Header />
        <main className="pt-28 pb-24 px-6 sm:px-8 min-h-screen flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <div className="text-center max-w-xs">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Not available in your region</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This product is not available for purchase in your country.
              {restricted && restricted.length > 0 && <> Available in: {restricted.join(", ")}.</>}
            </p>
          </div>
          <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Browse available products
          </Link>
        </main>
      </>
    );
  }

  return <ProductDetail product={product} restrictedCountries={restricted} />;
}
