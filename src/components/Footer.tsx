import Link from "next/link";

const SHOP_LINKS = [
  { label: "Shop All",      href: "/shop" },
  { label: "New Arrivals",  href: "/new-arrivals" },
  { label: "Deals",         href: "/deals" },
  { label: "Categories",    href: "/categories" },
];

const ACCOUNT_LINKS = [
  { label: "My Orders",  href: "/orders" },
  { label: "Saved",      href: "/saved" },
  { label: "Settings",   href: "/settings" },
  { label: "Help",       href: "/help" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
];

export function Footer() {
  return (
    <footer className="hidden md:block relative w-full bg-blue-950 dark:bg-gray-950 text-white overflow-hidden">

      {/* Glow blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/4 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full bg-sky-400/10 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-14 pb-10">

        {/* Top grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xl font-bold tracking-tight mb-2">Logos Royal</p>
            <p className="text-sm text-blue-200/70 leading-relaxed max-w-xs">
              Curated products across tech, fashion, beauty, home, and more. Quality you can trust.
            </p>
            <a
              href="mailto:logosroyalenterprise@gmail.com"
              className="inline-block mt-4 text-xs text-blue-300/80 hover:text-blue-200 transition-colors"
            >
              logosroyalenterprise@gmail.com
            </a>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/60 mb-4">Shop</p>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-blue-100/80 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/60 mb-4">Account</p>
            <ul className="space-y-2.5">
              {ACCOUNT_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-blue-100/80 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/60 mb-4">Legal</p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-blue-100/80 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-blue-200/50">
            &copy; {new Date().getFullYear()} Logos Royal Enterprise
          </p>
          <p className="text-xs text-blue-200/40">Made in Ghana</p>
        </div>

      </div>

      {/* Developer strip */}
      <div className="relative z-10 border-t border-white/5 bg-black/20 px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-center gap-2">
        <p className="text-xs text-blue-200/35">Built by</p>
        <a
          href="mailto:kelvinasiedu.larbi@gmail.com"
          className="text-xs font-medium text-blue-300/60 hover:text-blue-200 transition-colors"
        >
          Kelvin Asiedu
        </a>
      </div>
    </footer>
  );
}
