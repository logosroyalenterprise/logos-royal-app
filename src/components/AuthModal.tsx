"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "••••••••"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

type Tab = "signin" | "signup";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all";

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("signin");
  const [mounted, setMounted] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // sign-up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const close = useCallback(() => {
    setMounted(false);
    setError(null);
    setShowEmail(false);
    setTimeout(() => setOpen(false), 200);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: Tab };
      setTab(detail?.tab ?? "signin");
      setError(null);
      setShowEmail(false);
      setOpen(true);
      setTimeout(() => setMounted(true), 10);
    };
    window.addEventListener("open-auth-modal", handler);
    return () => window.removeEventListener("open-auth-modal", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail,
      password: siPassword,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    close();
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (suPassword !== suConfirm) { setError("Passwords don't match."); return; }
    if (suPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
      options: { data: { full_name: suName } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setError(null);
    setTab("signin");
    setShowEmail(false);
    setError("Account created. Check your email to confirm, then sign in.");
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-200 flex items-center justify-center p-4 transition-all duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />

      <div className={`relative w-full max-w-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl p-8 [box-shadow:0_0_60px_rgba(147,197,253,0.2)] transition-all duration-200 ${mounted ? "scale-100 translate-y-0" : "scale-95 translate-y-2"}`}>

        <button
          onClick={close}
          className="absolute top-5 right-5 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">
            {tab === "signin" ? "Welcome back!" : "Let's get started!"}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="relative flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-6">
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-900 [box-shadow:0_1px_4px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: tab === "signup" ? "translateX(calc(100% + 8px))" : "translateX(0)" }}
          />
          {(["signin", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setShowEmail(false); }}
              className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${tab === t ? "text-blue-950 dark:text-blue-100" : "text-gray-400 dark:text-gray-500"}`}
            >
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {error && (
          <p className={`text-xs mb-4 px-3 py-2 rounded-lg ${error.startsWith("Account created") ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"}`}>
            {error}
          </p>
        )}

        {/* OAuth */}
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        {/* Email toggle */}
        <button
          type="button"
          onClick={() => setShowEmail((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`transition-transform duration-200 ${showEmail ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          {showEmail ? "Hide" : "Continue with email"}
        </button>

        {/* Email forms — collapsed by default */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: showEmail ? "600px" : "0px", opacity: showEmail ? 1 : 0 }}
        >
          <div className="pt-4">
            {tab === "signin" && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="si-email" className="text-xs font-medium text-gray-500">Email</label>
                  <input id="si-email" type="email" placeholder="you@example.com" required
                    value={siEmail} onChange={(e) => setSiEmail(e.target.value)}
                    className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="si-password" className="text-xs font-medium text-gray-500">Password</label>
                  <PasswordInput id="si-password" value={siPassword} onChange={setSiPassword} />
                  <button type="button" className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 self-end transition-colors">
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-[#01013a] text-sm font-semibold rounded-full active:scale-[0.98] transition-all"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="su-name" className="text-xs font-medium text-gray-500">Full name</label>
                  <input id="su-name" type="text" placeholder="Kelvin Asiedu" required
                    value={suName} onChange={(e) => setSuName(e.target.value)}
                    className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="su-email" className="text-xs font-medium text-gray-500">Email</label>
                  <input id="su-email" type="email" placeholder="you@example.com" required
                    value={suEmail} onChange={(e) => setSuEmail(e.target.value)}
                    className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="su-password" className="text-xs font-medium text-gray-500">Password</label>
                  <PasswordInput id="su-password" placeholder="At least 8 characters" value={suPassword} onChange={setSuPassword} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="su-confirm" className="text-xs font-medium text-gray-500">Confirm password</label>
                  <PasswordInput id="su-confirm" value={suConfirm} onChange={setSuConfirm} />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-[#01013a] text-sm font-semibold rounded-full active:scale-[0.98] transition-all"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export function openAuthModal(tab: Tab = "signin") {
  window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab } }));
}
