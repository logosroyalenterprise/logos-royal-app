import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://logosroyal.com";

const STATIC_ROUTES = [
  { url: BASE, priority: 1.0, changeFrequency: "daily" as const },
  { url: `${BASE}/shop`, priority: 0.9, changeFrequency: "daily" as const },
  { url: `${BASE}/new-arrivals`, priority: 0.8, changeFrequency: "weekly" as const },
  { url: `${BASE}/deals`, priority: 0.8, changeFrequency: "daily" as const },
  { url: `${BASE}/categories`, priority: 0.7, changeFrequency: "weekly" as const },
  { url: `${BASE}/help`, priority: 0.5, changeFrequency: "monthly" as const },
  { url: `${BASE}/privacy`, priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase.from("products") as any)
    .select("id, updated_at")
    .eq("published", true);

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map(
    (p: { id: string; updated_at: string }) => ({
      url: `${BASE}/product/${p.id}`,
      lastModified: new Date(p.updated_at),
      priority: 0.7,
      changeFrequency: "weekly" as const,
    }),
  );

  return [...STATIC_ROUTES, ...productRoutes];
}
