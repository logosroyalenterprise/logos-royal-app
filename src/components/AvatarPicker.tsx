"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { openAuthModal } from "@/components/AuthModal";
import { useUserData } from "@/context/UserDataContext";

const MENU_ITEMS = [
  { label: "My orders", href: "/orders" },
  { label: "Help",      href: "/help" },
  { label: "Settings",  href: "/settings" },
];

export function AvatarPicker() {
  const [open, setOpen] = useState(false);
  const { user, role } = useUserData();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await supabase.auth.signOut();
    router.refresh();
  }

  const rawName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
  const initials = rawName
    ? (rawName as string).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <div ref={ref} className="relative shrink-0 ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex items-center justify-center p-2.5 rounded-full border-2 border-blue-950 dark:border-blue-200 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
      >
        {initials ? (
          <span className="text-xs font-bold text-blue-950 dark:text-blue-200 w-4 h-4 flex items-center justify-center leading-none">
            {initials}
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="text-blue-950 dark:text-blue-200">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-52 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 [box-shadow:0_8px_40px_rgba(0,0,0,0.10)] py-2 overflow-hidden">
          {user ? (
            <>
              <div className="px-5 py-2 mb-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {rawName ?? "Account"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              </div>
              {role === "admin" && (
                <Link href="/admin/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Admin panel
                </Link>
              )}
              {MENU_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="block px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-5 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setOpen(false); openAuthModal("signin"); }}
                className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => { setOpen(false); openAuthModal("signup"); }}
                className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                Create account
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <Link href="/help" onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                Help
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
