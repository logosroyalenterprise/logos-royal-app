"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { CategoriesMenu } from "@/components/CategoriesMenu";
import { useUserData } from "@/context/UserDataContext";

function SavedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm0 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Shop",         href: "/shop" },
  { label: "Deals",        href: "/deals" },
  { label: "New Arrivals", href: "/new-arrivals" },
];

export function Header() {
  const pathname = usePathname();
  const { bagCount } = useUserData();
  const [scrolled, setScrolled] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [logoRight, setLogoRight] = useState(220);
  const [pillWidth, setPillWidth] = useState(560);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const pillRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      setViewportWidth(window.innerWidth);
      if (logoRef.current) setLogoRight(logoRef.current.getBoundingClientRect().right + 16);
      if (pillRef.current) setPillWidth(pillRef.current.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const livePillWidth = pillWidth;
  const liveVW = viewportWidth;
  const isHome = pathname === "/";
  const pillTransform = !isHome || scrolled
    ? `translateX(${liveVW / 2 - 432 - livePillWidth}px)`
    : `translateX(-${livePillWidth / 2}px)`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-screen">
      <div className="relative h-16 px-6 sm:px-8 lg:px-12 flex items-center gap-4 w-full min-w-0">

        {/* Logo */}
        <Link ref={logoRef} href="/" className={`shrink-0 flex items-center gap-2.5 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm px-3 py-1.5 rounded-full transition-[opacity,transform] duration-500 ease-out ${scrolled ? "opacity-0 md:opacity-100 -translate-x-2 md:translate-x-0" : "opacity-100 translate-x-0"}`}>
          <Image
            src="/logos-royal-logo-v2.png"
            alt="Logos Royal"
            width={36}
            height={29}
            priority
            className="object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-blue-900 dark:text-blue-100">
              Logos Royal
            </span>
            <span className="text-[9px] font-medium tracking-[0.18em] uppercase text-blue-500 dark:text-blue-400 mt-0.5">
              Enterprise
            </span>
          </div>
        </Link>

        {/* Nav pill — absolute, transitions from viewport center to after logo */}
        <nav
          ref={pillRef as React.RefObject<HTMLElement>}
          className="hidden md:flex items-center border-2 border-blue-950 dark:border-blue-200 rounded-full p-1 gap-0.5 absolute z-20 transition-all duration-500 ease-in-out bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm"
          style={{ left: "50%", transform: pillTransform }}
        >
          {NAV_LINKS.slice(0, 1).map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={`px-4 py-1.5 text-sm rounded-full transition-all whitespace-nowrap ${active ? "bg-blue-300 dark:bg-blue-700 text-blue-950 dark:text-blue-50 font-semibold" : "text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"}`}>
                {link.label}
              </Link>
            );
          })}
          <CategoriesMenu />
          {NAV_LINKS.slice(1).map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 text-sm rounded-full transition-all whitespace-nowrap ${
                  active
                    ? "bg-blue-300 dark:bg-blue-700 text-blue-950 dark:text-blue-50 font-semibold"
                    : "text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="w-px h-4 bg-blue-950/20 dark:bg-blue-200/20 mx-1" />
          <Link href="/saved" className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all whitespace-nowrap">
            <SavedIcon />
            Saved
          </Link>
          <Link href="/bag" className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-blue-950 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all whitespace-nowrap">
            <BagIcon />
            Bag{bagCount > 0 ? ` · ${bagCount}` : ""}
          </Link>
        </nav>

        {/* Compact search — home page only */}
        <div
          className="hidden md:flex absolute inset-y-0 z-10 items-center transition-all duration-500 ease-in-out"
          style={{
            right: 100,
            width: 300,
            opacity: pathname === "/" && scrolled ? 1 : 0,
            pointerEvents: pathname === "/" && scrolled ? "auto" : "none",
            transform: pathname === "/" && scrolled ? "translateY(0)" : "translateY(4px)",
          }}
        >
          <div className="relative w-full">
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search or browse categories"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              className="w-full pl-5 pr-10 rounded-full border-2 border-blue-950 dark:border-blue-200 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm text-sm focus:outline-none focus:border-[3px] transition-all"
              style={{ height: pillRef.current ? pillRef.current.offsetHeight : 47 }}
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-300 hover:bg-blue-400 dark:bg-blue-700 text-blue-950 dark:text-blue-50 rounded-full transition-colors" aria-label="Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search — fades in over logo when scrolled */}
        <div className={`md:hidden absolute left-6 w-[70%] max-w-sm inset-y-0 flex items-center transition-[opacity,transform] duration-500 ease-out ${scrolled ? "opacity-100 pointer-events-auto translate-x-0" : "opacity-0 pointer-events-none -translate-x-4"}`}>
          <div className="relative w-full">
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search for something..."
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              className="w-full pl-5 pr-12 py-2 rounded-full border-2 border-blue-950 dark:border-blue-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-sm focus:outline-none focus:border-[3px] transition-all"
            />
            <button
              aria-label="Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-300 hover:bg-blue-400 dark:bg-blue-700 text-blue-950 dark:text-blue-50 rounded-full transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Avatar — always far right */}
        <AvatarPicker />

      </div>
    </header>
  );
}
