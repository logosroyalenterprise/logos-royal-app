import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Testimonials } from "@/components/Testimonials";
import { TRENDING, BEST_SELLING, NEW_ARRIVALS } from "@/data/products";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <Header />
      <main className="w-full pb-24 md:pb-0">
        <Hero />
        <CategoryGrid />
        <FeaturedProducts title="Trending Now"  order={TRENDING}      className="bg-gray-100 dark:bg-gray-900" />
        <FeaturedProducts title="Best Selling"  order={BEST_SELLING}  className="bg-gray-100 dark:bg-gray-900" />
        <FeaturedProducts title="New Arrivals"  order={NEW_ARRIVALS}  className="bg-gray-100 dark:bg-gray-900" />
        <Testimonials />
      </main>
    </div>
  );
}
