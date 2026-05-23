"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { useUserData } from "@/context/UserDataContext";
import { ALL_PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/FeaturedProducts";

export default function SavedPage() {
  const { user, savedIds } = useUserData();

  const savedProducts = ALL_PRODUCTS.filter((p) => savedIds.has(p.id));

  if (!user) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-base font-semibold">Sign in to view saved items</p>
          <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Browse products
          </Link>
        </main>
      </>
    );
  }

  if (savedProducts.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-28 px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-12">Saved</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-24">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300 dark:text-blue-700">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">Nothing saved yet</p>
              <p className="text-sm text-gray-500 mt-1">Tap the heart on any product to save it</p>
            </div>
            <Link href="/shop" className="px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
              Browse products
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-6 sm:px-8 lg:px-12 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-10">
          Saved <span className="text-gray-400 font-normal text-xl">({savedProducts.length})</span>
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {savedProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} sectionTitle="Saved" index={i} />
          ))}
        </div>
      </main>
    </>
  );
}
