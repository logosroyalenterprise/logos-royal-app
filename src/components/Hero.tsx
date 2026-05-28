"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FloatingCards } from "@/components/FloatingCards";
import { createClient } from "@/lib/supabase/client";
import { ALL_PRODUCTS } from "@/data/products";

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const searchQueryRef = useRef("");

  // Sync with Header nav search
  useEffect(() => {
    searchQueryRef.current = searchQuery;
    window.dispatchEvent(new CustomEvent("hero-query", { detail: searchQuery }));
  }, [searchQuery]);
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (q !== searchQueryRef.current) setSearchQuery(q);
    };
    window.addEventListener("nav-query", handler);
    return () => window.removeEventListener("nav-query", handler);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) { setSuggestions([]); return; }
    // Phase 1: instant static results
    const staticIds = new Set(ALL_PRODUCTS.map((p) => p.id));
    const staticSuggs = ALL_PRODUCTS
      .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({ id: p.id, name: p.name }));
    setSuggestions(staticSuggs);
    // Phase 2: augment with DB results
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("products") as any)
        .select("id, name")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,sub_category.ilike.%${q}%`)
        .eq("published", true)
        .limit(6);
      if (!data) return;
      const dbSuggs = (data as { id: string; name: string }[]).filter((p) => !staticIds.has(p.id));
      setSuggestions((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        const fresh = dbSuggs.filter((s) => !seen.has(s.id));
        return [...prev, ...fresh].slice(0, 6);
      });
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  function submit(q: string) {
    setSuggestions([]);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <section className="relative z-20 w-full pt-44 pb-0 sm:pt-52 sm:pb-0 px-6 sm:px-8 lg:px-12 flex flex-col items-center justify-center">
      {/* Radial glow behind search */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 -bottom-48 overflow-hidden" aria-hidden="true">
        {/* Center bloom */}
        <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 translate-y-[-35%] w-70 h-50 sm:w-125 sm:h-75 lg:w-175 lg:h-95 rounded-full bg-blue-300/40 dark:bg-blue-500/30 blur-3xl" />
        {/* Left wing */}
        <div className="absolute top-1/3 sm:top-1/2 left-1/4 -translate-x-1/2 translate-y-[-40%] w-45 h-35 sm:w-75 sm:h-50 lg:w-105 lg:h-70 rounded-full bg-indigo-300/35 dark:bg-indigo-500/25 blur-3xl" />
        {/* Right wing */}
        <div className="absolute top-1/3 sm:top-1/2 right-1/4 translate-x-1/2 translate-y-[-40%] w-45 h-35 sm:w-75 sm:h-50 lg:w-105 lg:h-70 rounded-full bg-sky-200/35 dark:bg-sky-400/20 blur-3xl" />
      </div>

      <FloatingCards />

      <div className="relative z-10 max-w-2xl w-full text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-8 sm:mb-12">
          Shop{" "}
          <span className="relative inline-block whitespace-nowrap">
            anything
            <svg
              aria-hidden="true"
              className="absolute -bottom-2 left-0 w-full text-blue-500 dark:text-blue-400 overflow-visible"
              height="10"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path
                d="M1 7 C 12 3, 28 9, 48 5.5 C 64 2.5, 80 8.5, 99 6"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>{" "}
          you want.
        </h1>

        <div className={`relative transition-all duration-500 ${scrolled ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"}`}>
          <input
            type="text"
            aria-label="Search products"
            placeholder="Search for something..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchQuery.trim() && submit(searchQuery)}
            className="w-full pl-6 pr-24 py-4 rounded-full bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm border-2 border-blue-950 dark:border-blue-200 text-sm sm:text-base font-normal focus:outline-none focus:border-[3px] focus:scale-[1.01] transition-all"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 sm:px-5 py-2.5 bg-blue-300 hover:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 text-blue-950 dark:text-blue-50 text-sm font-semibold rounded-full transition-colors"
            onClick={() => searchQuery.trim() && submit(searchQuery)}
          >
            Shop
          </button>

          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden [box-shadow:0_4px_24px_rgba(0,0,0,0.10)] z-999">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    className="w-full text-left px-5 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    onMouseDown={() => { setSuggestions([]); router.push(`/product/${s.id}`); }}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
