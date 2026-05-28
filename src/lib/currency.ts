import { useState, useEffect } from "react";
import { sanitizeCountry } from "./geo";

export const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string; name: string }> = {
  GH: { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  NG: { code: "NGN", symbol: "₦",   name: "Nigerian Naira" },
  KE: { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  ZA: { code: "ZAR", symbol: "R",   name: "South African Rand" },
  EG: { code: "EGP", symbol: "E£",  name: "Egyptian Pound" },
  US: { code: "USD", symbol: "$",   name: "US Dollar" },
  CA: { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  BR: { code: "BRL", symbol: "R$",  name: "Brazilian Real" },
  MX: { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  GB: { code: "GBP", symbol: "£",   name: "British Pound" },
  CH: { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  SE: { code: "SEK", symbol: "kr",  name: "Swedish Krona" },
  NO: { code: "NOK", symbol: "kr",  name: "Norwegian Krone" },
  DK: { code: "DKK", symbol: "kr",  name: "Danish Krone" },
  DE: { code: "EUR", symbol: "€",   name: "Euro" },
  FR: { code: "EUR", symbol: "€",   name: "Euro" },
  IT: { code: "EUR", symbol: "€",   name: "Euro" },
  ES: { code: "EUR", symbol: "€",   name: "Euro" },
  NL: { code: "EUR", symbol: "€",   name: "Euro" },
  BE: { code: "EUR", symbol: "€",   name: "Euro" },
  PT: { code: "EUR", symbol: "€",   name: "Euro" },
  AT: { code: "EUR", symbol: "€",   name: "Euro" },
  IE: { code: "EUR", symbol: "€",   name: "Euro" },
  FI: { code: "EUR", symbol: "€",   name: "Euro" },
  GR: { code: "EUR", symbol: "€",   name: "Euro" },
  JP: { code: "JPY", symbol: "¥",   name: "Japanese Yen" },
  CN: { code: "CNY", symbol: "¥",   name: "Chinese Yuan" },
  IN: { code: "INR", symbol: "₹",   name: "Indian Rupee" },
  AU: { code: "AUD", symbol: "A$",  name: "Australian Dollar" },
  NZ: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  SG: { code: "SGD", symbol: "S$",  name: "Singapore Dollar" },
  HK: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  KR: { code: "KRW", symbol: "₩",   name: "South Korean Won" },
};

export const SUPPORTED_CURRENCIES = Array.from(
  new Map(Object.values(COUNTRY_CURRENCY).map((c) => [c.code, c])).values()
).sort((a, b) => a.name.localeCompare(b.name));

const PREF_KEY = "preferred-currency";
const CHANGE_EVENT = "currency-preference-changed";
const LOC_COOKIE = "preferred-location";
const LOC_CHANGED = "location-preference-changed";

export function getPreferredLocation(): string | null {
  if (typeof window === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)preferred-location=([^;]+)/);
  return m ? (sanitizeCountry(decodeURIComponent(m[1])) ?? null) : null;
}

export function setPreferredLocation(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) {
    document.cookie = `${LOC_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } else {
    document.cookie = `${LOC_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
  window.dispatchEvent(new Event(LOC_CHANGED));
}

export function getPreferredCurrencyCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PREF_KEY);
}

export function setPreferredCurrencyCode(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) localStorage.setItem(PREF_KEY, code);
  else localStorage.removeItem(PREF_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

let _rates: Record<string, number> | null = null;
let _rateTime = 0;

async function getRates(): Promise<Record<string, number> | null> {
  if (_rates && Date.now() - _rateTime < 3_600_000) return _rates;
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const d = await r.json();
    if (d.result === "success") {
      _rates = d.rates as Record<string, number>;
      _rateTime = Date.now();
      return _rates;
    }
  } catch { /* network failure — show USD */ }
  return null;
}

export function useUserCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => {
    const raw = document.cookie.match(/(?:^|;\s*)user-country=([^;]+)/)?.[1];
    setCountry(
      sanitizeCountry(raw ? decodeURIComponent(raw) : null) ??
      sanitizeCountry(process.env.NEXT_PUBLIC_GEO_TEST_COUNTRY ?? null)
    );
  }, []);
  return country;
}

export interface CurrencyCtx {
  code: string;
  symbol: string;
  name: string;
  rateFromUSD: number | null;
  convert: (priceStr: string, fromCurrency?: string) => string;
}

export function useLiveCurrency(country: string | null): CurrencyCtx {
  const detectedInfo = country ? (COUNTRY_CURRENCY[country] ?? null) : null;
  const [overrideCode, setOverrideCode] = useState<string | null>(null);
  const [rateFromUSD, setRateFromUSD] = useState<number | null>(null);
  const [ghsPerUSD, setGhsPerUSD] = useState<number | null>(null);

  useEffect(() => {
    setOverrideCode(getPreferredCurrencyCode());
    const handler = () => setOverrideCode(getPreferredCurrencyCode());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const info = overrideCode
    ? (SUPPORTED_CURRENCIES.find((c) => c.code === overrideCode) ?? detectedInfo)
    : detectedInfo;

  const currencyCode = info?.code ?? null;

  useEffect(() => {
    if (!currencyCode || currencyCode === "USD") { setRateFromUSD(1); return; }
    getRates().then((rates) => {
      if (rates) {
        setRateFromUSD(rates[currencyCode] ?? null);
        setGhsPerUSD(rates["GHS"] ?? null);
      }
    });
  }, [currencyCode]);

  function convert(priceStr: string, fromCurrency = "USD"): string {
    const amount = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
    if (isNaN(amount)) return priceStr;

    // Convert source to USD first
    let usdAmount: number;
    if (fromCurrency === "GHS") {
      // Ghana user viewing a GHS-priced product — show as-is
      if (info?.code === "GHS") {
        return `GH₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      // Other users: GHS → USD → target
      if (!ghsPerUSD) return `GH₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      usdAmount = amount / ghsPerUSD;
    } else {
      usdAmount = amount;
    }

    if (!info || !rateFromUSD) return `$${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (info.code === "USD") return `$${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const converted = usdAmount * rateFromUSD;
    const isWhole = info.code === "JPY" || info.code === "KRW";
    const formatted = isWhole
      ? Math.round(converted).toLocaleString()
      : converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${info.symbol}${formatted}`;
  }

  return {
    code: info?.code ?? "USD",
    symbol: info?.symbol ?? "$",
    name: info?.name ?? "US Dollar",
    rateFromUSD,
    convert,
  };
}
