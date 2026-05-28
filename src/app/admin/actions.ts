"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

// ── Products ────────────────────────────────────────────────

function extractProduct(fd: FormData) {
  const str = (k: string) => (fd.get(k) as string | null) ?? "";
  const lines = (k: string) => str(k).split("\n").map(s => s.trim()).filter(Boolean);
  const csv   = (k: string) => str(k).split(",").map(s => s.trim()).filter(Boolean);
  const json  = (k: string) => { try { return JSON.parse(str(k)); } catch { return null; } };

  return {
    id:           str("id").trim().toLowerCase().replace(/\s+/g, "-"),
    name:         str("name"),
    description:  str("description") || null,
    currency:     str("currency") || "USD",
    price:        parseFloat(str("price")),
    shipping_fee: parseFloat(str("shipping_fee") || "0") || 0,
    category:     str("category"),
    sub_category: str("sub_category") || null,
    stock_count:  parseInt(str("stock_count") || "0", 10),
    in_stock:     parseInt(str("stock_count") || "0", 10) > 0,
    img:          str("img") || null,
    images:       lines("images"),
    sizes:        csv("sizes"),
    highlights:   lines("highlights"),
    colors:       json("colors"),
    attrs:        json("attrs"),
    published:    fd.get("published") !== "false",
    restricted_countries: (() => {
      const rc = json("restricted_countries");
      return Array.isArray(rc) && rc.length > 0 ? rc : null;
    })(),
  };
}

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const data = extractProduct(formData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("products").insert(data as any);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const { id: _id, ...data } = extractProduct(formData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("products").update(data as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateSiteSettings(formData: FormData) {
  const supabase = await requireAdmin();
  const str = (k: string) => (formData.get(k) as string | null) ?? "";
  const pairs: { key: string; value: string }[] = [
    { key: "featured_days_window", value: String(Math.max(1, parseInt(str("featured_days_window") || "30", 10) || 30)) },
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("site_settings") as any).upsert(pairs, { onConflict: "key" });
  revalidatePath("/admin/settings");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
}

export async function bulkDeleteProducts(ids: string[]) {
  const supabase = await requireAdmin();
  await supabase.from("products").delete().in("id", ids);
  revalidatePath("/admin/products");
}

export async function bulkSetPublished(ids: string[], published: boolean) {
  const supabase = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("products").update({ published } as any).in("id", ids);
  revalidatePath("/admin/products");
}

// ── Orders ──────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const status = formData.get("status") as string;
  const supabase = await requireAdmin();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}


// ── Users ───────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: "customer" | "admin") {
  const supabase = await requireAdmin();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
}

// ── Admin invite ─────────────────────────────────────────────
// Requires SUPABASE_SERVICE_ROLE_KEY in env + Supabase Auth invite API

export async function inviteAdmin(formData: FormData) {
  const email = (formData.get("email") as string).trim();
  if (!email) throw new Error("Email required");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Service role key not configured — set SUPABASE_SERVICE_ROLE_KEY in env.");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/invite`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ email, data: { role: "admin" } }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.msg ?? "Invite failed");
  }

  revalidatePath("/admin/settings");
}
