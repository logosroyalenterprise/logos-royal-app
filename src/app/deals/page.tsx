import { Header } from "@/components/Header";
import { ProductCard } from "@/components/FeaturedProducts";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ALL_PRODUCTS } from "@/data/products";
import { FLASH_DEALS, WEEKLY_DEALS, CLEARANCE_DEALS } from "@/data/deals";
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

export default function DealsPage() {
  const flashProducts  = FLASH_DEALS.map((d)     => ({ deal: d, product: ALL_PRODUCTS.find((p) => p.id === d.productId)! })).filter((x) => x.product);
  const weeklyProducts = WEEKLY_DEALS.map((d)    => ({ deal: d, product: ALL_PRODUCTS.find((p) => p.id === d.productId)! })).filter((x) => x.product);
  const clearProducts  = CLEARANCE_DEALS.map((d) => ({ deal: d, product: ALL_PRODUCTS.find((p) => p.id === d.productId)! })).filter((x) => x.product);

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
