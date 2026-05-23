"use client";

import { Header } from "@/components/Header";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserData } from "@/context/UserDataContext";
import { sanitizeCountry, GEO_COUNTRIES } from "@/lib/geo";
import { useUserCountry, useLiveCurrency, SUPPORTED_CURRENCIES, COUNTRY_CURRENCY, getPreferredCurrencyCode, setPreferredCurrencyCode, getPreferredLocation, setPreferredLocation } from "@/lib/currency";

// --- Icons ---
function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function AddressIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
}
function PaymentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// --- Data ---
const SECTIONS = [
  { id: "profile",       label: "Your profile",      Icon: ProfileIcon },
  { id: "addresses",     label: "Addresses",         Icon: AddressIcon },
  { id: "notifications", label: "Notifications",     Icon: BellIcon },
  { id: "privacy",       label: "Privacy",           Icon: ShieldIcon },
  { id: "region",        label: "Region & Language", Icon: GlobeIcon },
];

type FieldRow =
  | { type: "toggle"; label: string; sub?: string; defaultOn: boolean };

const CONTENT: Record<string, { title: string; fields: FieldRow[] }> = {
  notifications: {
    title: "Notifications",
    fields: [
      { type: "toggle", label: "Order updates",        sub: "Shipping, delivery and cancellation",   defaultOn: true },
      { type: "toggle", label: "Deals and promotions", sub: "Flash deals, coupons and offers",       defaultOn: true },
      { type: "toggle", label: "New arrivals",         sub: "Fresh drops in your saved categories",  defaultOn: false },
      { type: "toggle", label: "Weekly digest",        sub: "Roundup of the week's top picks",       defaultOn: false },
    ],
  },
};

// --- Toggle component ---
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-checked={on}
      role="switch"
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        on ? "bg-blue-950 dark:bg-blue-200" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// --- Notifications panel ---
function NotificationsPanel() {
  const section = CONTENT["notifications"];
  const [toggles, setToggles] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(section.fields.map((f, i) => [i, f.defaultOn]))
  );
  return (
    <div className="flex flex-col gap-5">
      {section.fields.map((field, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{field.label}</p>
            {field.sub && <p className="text-xs text-gray-400 mt-0.5">{field.sub}</p>}
          </div>
          <Toggle on={toggles[i]} onToggle={() => setToggles((t) => ({ ...t, [i]: !t[i] }))} />
        </div>
      ))}
    </div>
  );
}

// --- Profile panel ---
function ProfilePanel() {
  const { user } = useUserData();
  const [supabase] = useState(() => createClient());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const currentEmail = user?.email ?? "";
  const isEmailUser = user?.app_metadata?.provider === "email";

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles").select("full_name").eq("id", user.id).single() as any)
      .then(({ data }: { data: { full_name: string | null } | null }) => {
        setName(data?.full_name ?? "");
        setLoading(false);
      });
  }, [user, supabase]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleEmailChange() {
    if (!newEmail.trim() || newEmail.trim() === currentEmail) return;
    setEmailSaving(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` }
    );
    setEmailSaving(false);
    if (error) {
      setEmailMsg({ ok: false, text: error.message });
    } else {
      setEmailMsg({ ok: true, text: `Confirmation sent to ${newEmail.trim()}. Check your inbox to confirm the change.` });
      setNewEmail("");
      setShowEmailForm(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPw || !newPw || newPw !== confirmPw) return;
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: currentPw });
    if (signInError) {
      setPwSaving(false);
      setPwMsg({ ok: false, text: "Current password is incorrect." });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) {
      setPwMsg({ ok: false, text: error.message });
    } else {
      setPwMsg({ ok: true, text: "Password updated successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPwForm(false);
    }
  }

  if (loading) return <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputCls} />
        </div>
        <div>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="px-5 py-2 text-sm font-semibold bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-full disabled:opacity-40 transition-all">
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email address</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{currentEmail}</p>
          </div>
          {!showEmailForm && (
            <button onClick={() => { setShowEmailForm(true); setEmailMsg(null); }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              Change
            </button>
          )}
        </div>
        {emailMsg && (
          <p className={`text-xs ${emailMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            {emailMsg.text}
          </p>
        )}
        {showEmailForm && (
          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New email address</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com" className={inputCls} />
            </div>
            <p className="text-xs text-gray-400">A confirmation link will be sent to the new address.</p>
            <div className="flex gap-2">
              <button onClick={handleEmailChange}
                disabled={emailSaving || !newEmail.trim() || newEmail.trim() === currentEmail}
                className="px-5 py-2 text-sm font-semibold bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-full disabled:opacity-40 transition-all">
                {emailSaving ? "Sending…" : "Send confirmation"}
              </button>
              <button onClick={() => { setShowEmailForm(false); setNewEmail(""); setEmailMsg(null); }}
                className="px-5 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {isEmailUser && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Password</p>
              <p className="text-sm text-gray-400 mt-0.5 tracking-widest">••••••••</p>
            </div>
            {!showPwForm && (
              <button onClick={() => { setShowPwForm(true); setPwMsg(null); }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                Change
              </button>
            )}
          </div>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
              {pwMsg.text}
            </p>
          )}
          {showPwForm && (
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Current password</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Confirm new password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••" className={inputCls} />
              </div>
              <div className="flex gap-2">
                <button onClick={handlePasswordChange}
                  disabled={pwSaving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
                  className="px-5 py-2 text-sm font-semibold bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-full disabled:opacity-40 transition-all">
                  {pwSaving ? "Updating…" : "Update password"}
                </button>
                <button onClick={() => { setShowPwForm(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwMsg(null); }}
                  className="px-5 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// --- Privacy panel ---
function PrivacyPanel() {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1.5">Delete account</p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)}
            className="w-full text-left px-4 py-3 rounded-xl border border-red-200 dark:border-red-900 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            Permanently delete my account
          </button>
        ) : (
          <div className="rounded-xl border border-red-200 dark:border-red-900 p-4 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Are you sure? This cannot be undone.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">All your data, orders, and saved items will be permanently removed.</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
                Yes, delete everything
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Region panel ---
function RegionPanel() {
  const realCountry = useUserCountry();
  const [browseCountry, setBrowseCountry] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string>("USD");

  const effectiveCountry = browseCountry || realCountry;
  const { code, symbol, rateFromUSD } = useLiveCurrency(effectiveCountry);
  const realCountryName = realCountry ? (GEO_COUNTRIES.find((c) => c.code === realCountry)?.name ?? realCountry) : null;

  useEffect(() => {
    const storedLoc = getPreferredLocation();
    setBrowseCountry(storedLoc ?? "");
    const storedCur = getPreferredCurrencyCode();
    setSelectedCode(storedCur ?? (realCountry ? (COUNTRY_CURRENCY[realCountry]?.code ?? "USD") : "USD"));
  }, [realCountry]);

  function handleLocationChange(code: string) {
    setBrowseCountry(code);
    setPreferredLocation(code || null);
  }

  function handleCurrencyChange(newCode: string) {
    setSelectedCode(newCode);
    setPreferredCurrencyCode(newCode);
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Detected location</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{realCountryName ?? "Not detected"}</p>
        <p className="text-xs text-gray-400 mt-1">
          {realCountryName
            ? "Detected from your network. Used for purchase restrictions."
            : "Could not detect your location. Restricted products default to allowed."}
        </p>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Browse location</label>
        <select value={browseCountry} onChange={(e) => handleLocationChange(e.target.value)} className={inputCls}>
          <option value="">Use detected location</option>
          {GEO_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Affects which products are visible. Adding to cart requires your real location to be eligible.
        </p>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Preferred currency</label>
        <select value={selectedCode} onChange={(e) => handleCurrencyChange(e.target.value)} className={inputCls}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
          ))}
        </select>
        {rateFromUSD && code !== "USD" && (
          <p className="text-xs text-gray-400 mt-1">
            1 USD = {symbol}{rateFromUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Addresses panel ---
interface AddressRow {
  id: string; label: string | null; full_name: string;
  line1: string; city: string; state: string | null; is_default: boolean;
}

const EMPTY_FORM = { label: "", full_name: "", line1: "", city: "", state: "" };
const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

function AddressesPanel() {
  const { user } = useUserData();
  const [supabase] = useState(() => createClient());
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("addresses").select("id, label, full_name, line1, city, state, is_default")
      .eq("user_id", user.id).order("is_default", { ascending: false }) as any);
    setAddresses(data ?? []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!user || !form.full_name.trim() || !form.line1.trim() || !form.city.trim()) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("addresses") as any).insert({
      user_id: user.id,
      label: form.label.trim() || null,
      full_name: form.full_name.trim(),
      line1: form.line1.trim(),
      city: form.city.trim(),
      state: form.state.trim() || null,
      country: "GH",
      is_default: addresses.length === 0,
    });
    await load();
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("addresses") as any).delete().eq("id", id).eq("user_id", user.id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSetDefault(id: string) {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("addresses") as any).update({ is_default: false }).eq("user_id", user.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("addresses") as any).update({ is_default: true }).eq("id", id).eq("user_id", user.id);
    await load();
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold">Addresses</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Add address
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[0,1].map((i) => <div key={i} className="h-28 flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`rounded-xl border p-4 text-sm transition-colors ${addr.is_default ? "border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20" : "border-gray-200 dark:border-gray-800"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                    {addr.full_name}
                    {addr.label && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded font-medium uppercase tracking-wide">{addr.label}</span>}
                    {addr.is_default && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded font-medium">Default</span>}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">{addr.line1}</p>
                  <p className="text-gray-500 dark:text-gray-400">{[addr.city, addr.state].filter(Boolean).join(", ")}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/80 transition-colors whitespace-nowrap">
                      Set default
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    aria-label="Remove address">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {addresses.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 py-4">No saved addresses yet.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">New address</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Full name</label>
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Ama Mensah" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Label (optional)</label>
              <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Home, Work…" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Street address</label>
            <input value={form.line1} onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))} placeholder="14 Cantonments Road" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Accra" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Region (optional)</label>
              <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="Greater Accra" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={saving || !form.full_name.trim() || !form.line1.trim() || !form.city.trim()}
              className="px-5 py-2 text-sm font-semibold bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-full disabled:opacity-40 transition-all">
              {saving ? "Saving…" : "Save address"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-5 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Page ---
export default function SettingsPage() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (window.innerWidth >= 768) setActive("profile");
  }, []);
  const activeIndex = SECTIONS.findIndex((s) => s.id === active);

  const section = active ? SECTIONS.find((s) => s.id === active) : null;

  function renderPanel() {
    switch (active) {
      case "profile":       return <ProfilePanel />;

      case "addresses":     return <AddressesPanel />;
      case "notifications": return <NotificationsPanel />;
      case "privacy":       return <PrivacyPanel />;
      case "region":        return <RegionPanel />;
      default:              return null;
    }
  }

  return (
    <>
      <Header />
      <main className="pt-28 px-6 sm:px-8 lg:px-12 pb-24 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">Settings</h1>

        {/* ── Mobile: drill-down ── */}
        <div className="md:hidden">
          {!active ? (
            /* Section list */
            <div className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => setActive(s.id)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left hover:bg-gray-100 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
                  <span className="text-gray-400 dark:text-gray-500 shrink-0">
                    <s.Icon />
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{s.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600 shrink-0"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          ) : (
            /* Content view */
            <div>
              <button onClick={() => setActive(null)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-6">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              {renderPanel()}
            </div>
          )}
        </div>

        {/* ── Desktop: sidebar + panel ── */}
        <div className="hidden md:flex gap-10 items-start max-w-4xl">
          <nav className="w-52 shrink-0 relative p-1" aria-label="Settings sections">
            <div
              className="absolute left-1 right-1 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 pointer-events-none"
              style={{
                transform: `translateY(${Math.max(activeIndex, 0) * 40}px)`,
                transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`relative z-10 w-full flex items-center gap-3 px-4 h-10 text-sm text-left transition-colors duration-200 ${
                  active === s.id
                    ? "text-blue-950 dark:text-blue-100 font-semibold"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <s.Icon />
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {active
              ? renderPanel()
              : <p className="text-sm text-gray-400">Select a section.</p>
            }
          </div>
        </div>
      </main>
    </>
  );
}
