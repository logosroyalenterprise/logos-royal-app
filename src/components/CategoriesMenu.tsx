"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const CATEGORIES = [
  {
    name: "Tech & Gadgets",
    href: "/shop?category=tech",
    sub: ["Headphones & Audio", "Laptops & Computers", "Cameras", "Smart Home", "Accessories"],
  },
  {
    name: "Fashion",
    href: "/shop?category=fashion",
    sub: ["Tops & Shirts", "Bottoms", "Outerwear", "Dresses", "Accessories"],
  },
  {
    name: "Food & Beverages",
    href: "/shop?category=food",
    sub: ["Coffee & Tea", "Snacks", "Beverages", "Pantry Staples", "Organic"],
  },
  {
    name: "Bags & Luggage",
    href: "/shop?category=bags",
    sub: ["Crossbody Bags", "Backpacks", "Totes", "Travel Bags", "Wallets"],
  },
  {
    name: "Beauty & Health",
    href: "/shop?category=beauty",
    sub: ["Skincare", "Haircare", "Wellness", "Fragrance", "Tools"],
  },
  {
    name: "Home & Living",
    href: "/shop?category=home",
    sub: ["Lighting", "Furniture", "Decor", "Kitchen", "Storage"],
  },
];

export function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`px-4 py-1.5 text-sm rounded-full transition-all whitespace-nowrap ${
          open
            ? "bg-blue-300 dark:bg-blue-700 text-blue-950 dark:text-blue-50 font-semibold"
            : "text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
        }`}
      >
        Categories
      </button>

      {open && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 w-[640px] rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-2 border-blue-950/10 dark:border-blue-200/10 p-6 [box-shadow:0_16px_60px_rgba(0,0,0,0.12)]">
          <div className="grid grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <Link
                  href={cat.href}
                  onClick={() => setOpen(false)}
                  className="text-xs font-bold text-blue-950 dark:text-blue-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mb-2 block"
                >
                  {cat.name}
                </Link>
                <ul className="flex flex-col gap-1">
                  {cat.sub.map((s) => (
                    <li key={s}>
                      <Link
                        href={`${cat.href}&sub=${encodeURIComponent(s)}`}
                        onClick={() => setOpen(false)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-200 transition-colors"
                      >
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
