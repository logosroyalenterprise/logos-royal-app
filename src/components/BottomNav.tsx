"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUserData } from "@/context/UserDataContext";

const CATEGORIES = [
  { id: "tech",    name: "Tech & Gadgets",
    subs: ["Phones", "Laptops", "Audio", "Cameras", "Accessories"] },
  { id: "fashion", name: "Fashion",
    subs: ["Men's", "Women's", "Kids", "Shoes", "Accessories"] },
  { id: "food",    name: "Food & Beverages",
    subs: ["Fresh Produce", "Snacks", "Drinks", "Organic", "Pantry"] },
  { id: "bags",    name: "Bags & Luggage",
    subs: ["Backpacks", "Handbags", "Travel Bags", "Wallets"] },
  { id: "beauty",  name: "Beauty & Health",
    subs: ["Skincare", "Haircare", "Makeup", "Supplements", "Fitness"] },
  { id: "home",    name: "Home & Living",
    subs: ["Furniture", "Kitchen", "Decor", "Bedding", "Lighting"] },
];

type IconFn = (active: boolean) => React.ReactNode;

const NAV: { label: string; href: string; exact: boolean; icon: IconFn }[] = [
  { label: "Home", href: "/", exact: true,
    icon: (a) => a
      ? <svg width="20" height="20" viewBox="1 3 22 20" aria-hidden="true">
          <defs>
            <mask id="hn-m">
              <rect x="1" y="3" width="22" height="20" fill="white"/>
              <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </mask>
          </defs>
          <g fill="currentColor" mask="url(#hn-m)">
            <path d="M3 9L4.5 5Q5 4 6 4h12q1 0 1.5 1L21 9z"/>
            <path d="M4 9v9a3 3 0 0 0 3 3h2v-5h6v5h2a3 3 0 0 0 3-3V9z"/>
          </g>
        </svg>
      : <svg width="20" height="20" viewBox="1 3 22 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9L4.5 5Q5 4 6 4h12q1 0 1.5 1L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M4 9v9a3 3 0 0 0 3 3h2v-5h6v5h2a3 3 0 0 0 3-3V9"/></svg> },
  { label: "Shop", href: "/shop", exact: false,
    icon: (a) => a
      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H17c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.46 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
  { label: "Saved", href: "/saved", exact: false,
    icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke={a ? "none" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { label: "Bag", href: "/bag", exact: false,
    icon: (a) => a
      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm0 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="12" cy="11" r="2" fill="currentColor" stroke="none"/></svg> },
];

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { bagCount } = useUserData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [level, setLevel] = useState(0);
  const [selectedCat, setSelectedCat] = useState<typeof CATEGORIES[0] | null>(null);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const catActive = drawerOpen || pathname.startsWith("/categories");
  const anyActive = NAV.some(({ href, exact }) => isActive(href, exact)) || catActive;
  const homeActive = isActive("/", true) || !anyActive;

  const closeDrawer = () => { setDrawerOpen(false); setLevel(0); setSelectedCat(null); };

  const pickCat = (cat: typeof CATEGORIES[0]) => {
    setSelectedCat(cat);
    setLevel(1);
  };

  const goToSub = (catId: string, sub: string) => {
    closeDrawer();
    router.push(`/shop?category=${catId}&sub=${encodeURIComponent(sub)}`);
  };

  return (
    <>
      {/* Categories full-screen drawer */}
      <div className={`fixed inset-0 z-60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* Level 0 — main categories */}
        <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-out ${level === 0 ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-6 pt-14 pb-4">
            <h2 className="text-lg font-semibold text-blue-950 dark:text-blue-100">Categories</h2>
            <button onClick={closeDrawer} className="w-8 h-8 flex items-center justify-center rounded-full text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto pb-24">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => pickCat(cat)}
                className="flex items-center justify-between px-6 py-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-blue-950 dark:text-blue-300">{cat.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-950/30 dark:text-blue-300/30 shrink-0"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Level 1 — subcategories */}
        <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-out ${level === 1 ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center gap-3 px-6 pt-14 pb-4">
            <button onClick={() => setLevel(0)} className="w-8 h-8 flex items-center justify-center rounded-full text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h2 className="text-lg font-semibold text-blue-950 dark:text-blue-100">{selectedCat?.name}</h2>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto pb-24">
            {selectedCat?.subs.map((sub) => (
              <button key={sub} onClick={() => goToSub(selectedCat.id, sub)}
                className="flex items-center justify-between px-6 py-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-blue-950 dark:text-blue-300">{sub}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-950/30 dark:text-blue-300/30 shrink-0"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom nav pill */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm [box-shadow:0_4px_32px_rgba(0,0,0,0.14)] rounded-full px-1.5 py-1.5 border-2 border-blue-950 dark:border-blue-200">

          {NAV.slice(0, 1).map(({ label, href, icon }) => (
            <Link key={href} href={href}
              className={`relative flex items-center gap-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${homeActive ? "bg-blue-300 dark:bg-blue-700 text-blue-950 dark:text-blue-50 px-4 py-2" : "text-blue-950 dark:text-blue-300 px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900"}`}
            >
              <span className="shrink-0">{icon(homeActive)}</span>
              {homeActive && <span className="text-sm font-semibold whitespace-nowrap">{label}</span>}
            </Link>
          ))}

          <button
            onClick={() => drawerOpen ? closeDrawer() : setDrawerOpen(true)}
            className={`flex items-center gap-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${catActive ? "bg-blue-300 dark:bg-blue-700 text-blue-950 dark:text-blue-50 px-4 py-2" : "text-blue-950 dark:text-blue-300 px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900"}`}
          >
            <span className="shrink-0"><GridIcon active={catActive} /></span>
            {catActive && <span className="text-sm font-semibold whitespace-nowrap">Categories</span>}
          </button>

          {NAV.slice(1).map(({ label, href, exact, icon }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href}
                className={`relative flex items-center gap-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${active ? "bg-blue-300 dark:bg-blue-700 text-blue-950 dark:text-blue-50 px-4 py-2" : "text-blue-950 dark:text-blue-300 px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900"}`}
              >
                <span className="shrink-0 relative">
                  {icon(active)}
                  {label === "Bag" && bagCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 text-[8px] font-bold flex items-center justify-center leading-none">
                      {bagCount > 9 ? "9+" : bagCount}
                    </span>
                  )}
                </span>
                {active && <span className="text-sm font-semibold whitespace-nowrap">{label}</span>}
              </Link>
            );
          })}

        </div>
      </nav>
    </>
  );
}
