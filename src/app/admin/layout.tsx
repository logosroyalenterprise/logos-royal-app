import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav, AdminMobileNav } from "./_components/AdminNav";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
  return { user, profile };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await verifyAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 h-full flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-40">
        <div className="h-14 px-4 flex items-center border-b border-gray-200 dark:border-gray-800 shrink-0">
          <Link href="/admin/dashboard" className="text-sm font-bold text-blue-950 dark:text-blue-100 tracking-tight">
            Logos Royal<span className="text-blue-500 ml-1 font-normal text-xs">Admin</span>
          </Link>
        </div>

        <AdminNav />

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{profile?.full_name ?? "Admin"}</p>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Back to store
          </Link>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Link href="/admin/dashboard" className="text-sm font-bold text-blue-950 dark:text-blue-100 tracking-tight">
          Logos Royal<span className="text-blue-500 ml-1 font-normal text-xs">Admin</span>
        </Link>
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          Back to store
        </Link>
      </header>

      {/* Main */}
      <div className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileNav />
    </div>
  );
}
