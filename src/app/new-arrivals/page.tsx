import { Header } from "@/components/Header";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { NEW_ARRIVALS } from "@/data/products";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Arrivals" };

export default function NewArrivalsPage() {
  return (
    <>
      <Header />
      <main className="pt-28 min-h-screen">
        <div className="px-6 sm:px-8 lg:px-12 pb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">New Arrivals</h1>
          <p className="text-sm text-gray-500 mt-1">Fresh in, just for you</p>
        </div>
        <FeaturedProducts title="" order={NEW_ARRIVALS} />
      </main>
    </>
  );
}
