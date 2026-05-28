import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Testimonials } from "@/components/Testimonials";
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <Header />
      <main className="w-full pb-24 md:pb-0">
        <Hero />
        <CategoryGrid />
        <FeaturedProducts title="Trending Now"  strategy="trending"      className="bg-gray-100 dark:bg-gray-900" />
        <FeaturedProducts title="Best Selling"  strategy="best-selling"  className="bg-gray-100 dark:bg-gray-900" />
        <FeaturedProducts title="New Arrivals"  strategy="new-arrivals"  className="bg-gray-100 dark:bg-gray-900" />
        <Testimonials />
      </main>
    </div>
  );
}
