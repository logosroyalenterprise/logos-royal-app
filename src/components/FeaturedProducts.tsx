"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ALL_PRODUCTS, TRENDING, BEST_SELLING, NEW_ARRIVALS } from "@/data/products";
import type { Product } from "@/data/products";
import { useUserData } from "@/context/UserDataContext";
import { createClient } from "@/lib/supabase/client";
import { useUserCountry, useLiveCurrency } from "@/lib/currency";

export type { Product };
export { TRENDING, BEST_SELLING, NEW_ARRIVALS };


export function ProductCard({ product, sectionTitle, index, deal }: { product: Product; sectionTitle: string; index: number; deal?: { salePrice: string; discountPct: number } }) {
  const { savedIds, toggleSaved } = useUserData();
  const userCountry = useUserCountry();
  const { convert } = useLiveCurrency(userCountry);
  const wishlisted = savedIds.has(product.id);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [popped, setPopped] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(product.id);
    setPopped(true);
    setTimeout(() => setPopped(false), 300);
  };

  return (
    <div className="fade-slide-up" style={{ animationDelay: `${index * 0.07}s` }}>
      <Link href={`/product/${product.id}`} className="block">
        <div
          className="group text-left flex flex-col cursor-pointer rounded-2xl overflow-hidden [box-shadow:0_0_16px_rgba(147,197,253,0.12)] hover:[box-shadow:0_0_28px_rgba(147,197,253,0.35)]"
          style={{
            transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 0.15s ease, box-shadow 0.2s ease",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className={`relative w-full aspect-square ${product.bg}`}>
            <Image
              src={product.img}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />

            <span className="absolute bottom-2 left-2 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-blue-950 dark:text-blue-100">
              {product.category}
            </span>


            <button
              onClick={toggleWishlist}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ transform: popped ? "scale(1.4)" : "scale(1)", transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                fill={wishlisted ? "currentColor" : "none"}
                stroke="currentColor"
                className={wishlisted ? "text-red-500" : "text-blue-950 dark:text-blue-100"}
                style={{ transition: "fill 0.15s ease, color 0.15s ease" }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          <div className="p-3 flex flex-col gap-1 bg-white dark:bg-gray-950 flex-1">
            <p className="text-xs font-medium text-black dark:text-white leading-snug line-clamp-2 min-h-10">{product.name}</p>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <p className="text-base font-bold text-black dark:text-white">{deal ? convert(deal.salePrice) : convert(product.price)}</p>
                {deal && <p className="text-[10px] text-gray-400 line-through">{convert(product.price)}</p>}
                {deal && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">-{deal.discountPct}%</span>}
              </div>
              <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-black dark:text-white leading-none">
                <span className="relative flex items-center justify-center w-1.5 h-1.5">
                  {product.inStock && (
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  )}
                  <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${product.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                </span>
                {product.inStock ? "In stock" : "Sold out"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

interface Props {
  title: string;
  order?: string[];
  className?: string;
}

export function FeaturedProducts({ title, order = TRENDING, className = "" }: Props) {
  const rawProducts = order.map((id) => ALL_PRODUCTS.find((p) => p.id === id)!);
  const [ratingsMap, setRatingsMap] = useState<Map<string, { rating: number; count: number }>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    // Query actual reviews table — ignores stale seeded values in products.review_count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("reviews").select("product_id, rating").in("product_id", rawProducts.map((p) => p.id)) as any)
      .then(({ data }: { data: { product_id: string; rating: number }[] | null }) => {
        if (!data) return;
        const map = new Map<string, { rating: number; count: number }>();
        for (const r of data) {
          const prev = map.get(r.product_id) ?? { rating: 0, count: 0 };
          map.set(r.product_id, { rating: prev.rating + r.rating, count: prev.count + 1 });
        }
        // Average the ratings
        map.forEach((v, k) => map.set(k, { rating: Math.round((v.rating / v.count) * 10) / 10, count: v.count }));
        setRatingsMap(map);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const products = rawProducts.map((p) => {
    const real = ratingsMap.get(p.id);
    return real ? { ...p, rating: real.rating, reviews: real.count } : { ...p, reviews: 0 };
  });

  return (
    <section className={`w-full px-6 sm:px-8 lg:px-12 py-12 sm:py-16 ${className}`}>
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
        <button aria-label={`View all ${title}`} className="text-xs font-semibold px-4 py-1.5 rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">View all →</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product, i) => (
          <ProductCard key={`${title}-${product.id}`} product={product} sectionTitle={title} index={i} />
        ))}
      </div>
    </section>
  );
}
