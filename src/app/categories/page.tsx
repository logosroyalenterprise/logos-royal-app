import { Header } from "@/components/Header";
import { CategoryGrid } from "@/components/CategoryGrid";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="pt-28 min-h-screen">
        <div className="px-6 sm:px-8 lg:px-12 pb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Categories</h1>
        </div>
        <CategoryGrid />
      </main>
    </>
  );
}
