// Geographic restriction helpers — shared between admin form and server components

/**
 * Placeholder / sentinel codes that CDNs emit for unknown/Tor/satellite/regional traffic.
 * These are NOT real ISO 3166-1 alpha-2 country codes and must not be trusted as a location.
 * Cloudflare: T1 (Tor), XX (unknown), A1 (anonymous proxy), A2 (satellite), AP (Asia-Pacific region), EU (Europe region)
 * Vercel: XX (unknown)
 */
const INVALID_CODES = new Set(["XX", "T1", "T2", "ZZ", "A1", "A2", "AP", "EU", "AN", "O1"]);

/**
 * Sanitize a raw country string from CDN headers or cookies.
 * Returns a valid uppercase 2-letter ISO code, or null if unknown/invalid.
 * - Strips whitespace, takes first value if comma-separated (proxy stacking)
 * - Rejects placeholder codes CDNs emit for Tor, unknown, regional aggregates
 */
export function sanitizeCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.split(",")[0].trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  if (INVALID_CODES.has(code)) return null;
  return code;
}

export const GEO_COUNTRIES = [
  { code: "GH", name: "Ghana" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "ET", name: "Ethiopia" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "RW", name: "Rwanda" },
  { code: "CM", name: "Cameroon" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Senegal" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "MZ", name: "Mozambique" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "UAE" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
] as const;

/**
 * Returns true if the product is accessible from the given country.
 * Unknown/invalid country → allow (fail open so legitimate users aren't blocked).
 * Trust boundary: userCountry must come from the x-user-country header (set by
 * middleware from CDN headers), NOT from the user-country cookie which is
 * client-readable and can be tampered with.
 */
export function isAccessible(
  restrictedCountries: string[] | null | undefined,
  userCountry: string | null | undefined,
): boolean {
  if (!restrictedCountries || restrictedCountries.length === 0) return true;
  const clean = sanitizeCountry(userCountry);
  if (!clean) return true; // unknown/invalid country → allow
  return restrictedCountries.includes(clean);
}
