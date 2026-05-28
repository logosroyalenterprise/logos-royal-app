import { Header } from "@/components/Header";
import { ProductCard } from "@/components/FeaturedProducts";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ALL_PRODUCTS, mapDbToProduct } from "@/data/products";
import { FLASH_DEALS, WEEKLY_DEALS, CLEARANCE_DEALS, DEALS } from "@/data/deals";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Deals" };

function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default async function DealsPage() {
  // Fetch any deal products not in static array
  const staticIds = new Set(ALL_PRODUCTS.map((p) => p.id));
  const missingIds = [...new Set(DEALS.map((d) => d.productId))].filter((id) => !staticIds.has(id));
  let dbProducts: ReturnType<typeof mapDbToProduct>[] = [];
  if (missingIds.length) {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await ((supabase.from("products") as any).select("id, name, category, sub_category, price, img, images, in_stock, description, colors, sizes, highlights, attrs").in("id", missingIds).eq("published", true));
    dbProducts = data ? (data as Parameters<typeof mapDbToProduct>[0][]).map(mapDbToProduct) : [];
  }
  function findProduct(id: string) {
    return ALL_PRODUCTS.find((p) => p.id === id) ?? dbProducts.find((p) => p.id === id);
  }

  const flashProducts  = FLASH_DEALS.map((d)     => ({ deal: d, product: findProduct(d.productId) })).filter((x) => x.product) as { deal: typeof FLASH_DEALS[0]; product: NonNullable<ReturnType<typeof findProduct>> }[];
  const weeklyProducts = WEEKLY_DEALS.map((d)    => ({ deal: d, product: findProduct(d.productId) })).filter((x) => x.product) as { deal: typeof WEEKLY_DEALS[0]; product: NonNullable<ReturnType<typeof findProduct>> }[];
  const clearProducts  = CLEARANCE_DEALS.map((d) => ({ deal: d, product: findProduct(d.productId) })).filter((x) => x.product) as { deal: typeof CLEARANCE_DEALS[0]; product: NonNullable<ReturnType<typeof findProduct>> }[];

  const flashDuration = FLASH_DEALS[0]?.flashDurationMs ?? 6 * 60 * 60 * 1000;

  return (
    <>
      <Header />
      <main className="pt-28 pb-16 min-h-screen">
        <div className="px-6 sm:px-8 lg:px-12">

          {/* Flash Deals */}
          {flashProducts.length > 0 && (
            <section className="mb-16">
              <SectionHeader
                title="Flash Deals"
                sub="Grab them before time runs out"
                right={<CountdownTimer durationMs={flashDuration} />}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {flashProducts.map(({ deal, product }, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sectionTitle="flash-deals"
                    index={i}
                    deal={{ salePrice: deal.salePrice, discountPct: deal.discountPct }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Weekly Picks */}
          {weeklyProducts.length > 0 && (
            <section className="mb-16">
              <SectionHeader title="Weekly Picks" sub="Refreshes every Monday" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {weeklyProducts.map(({ deal, product }, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sectionTitle="weekly-deals"
                    index={i}
                    deal={{ salePrice: deal.salePrice, discountPct: deal.discountPct }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Clearance */}
          {clearProducts.length > 0 && (
            <section>
              <SectionHeader title="Clearance" sub="While stocks last" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {clearProducts.map(({ deal, product }, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sectionTitle="clearance"
                    index={i}
                    deal={{ salePrice: deal.salePrice, discountPct: deal.discountPct }}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  );
}
