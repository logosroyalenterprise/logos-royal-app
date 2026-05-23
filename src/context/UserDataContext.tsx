"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { openAuthModal } from "@/components/AuthModal";
import type { User } from "@supabase/supabase-js";

interface UserDataContextValue {
  user: User | null;
  role: "customer" | "admin" | null;
  bagCount: number;
  savedIds: Set<string>;
  toggleSaved: (productId: string) => Promise<void>;
  addToBag: (productId: string, color?: string | null, size?: string | null) => Promise<"added" | "auth" | "out_of_stock">;
  refreshBag: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextValue>({
  user: null,
  role: null,
  bagCount: 0,
  savedIds: new Set(),
  toggleSaved: async () => {},
  addToBag: async () => "auth",
  refreshBag: async () => {},
});

export function useUserData() {
  return useContext(UserDataContext);
}

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"customer" | "admin" | null>(null);
  const [bagCount, setBagCount] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [supabase] = useState(() => createClient());

  const fetchRole = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    setRole((data?.role as "customer" | "admin") ?? null);
  }, [supabase]);

  const fetchBagCount = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("bag_items")
      .select("quantity")
      .eq("user_id", userId);
    setBagCount(data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0);
  }, [supabase]);

  const fetchSavedIds = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("saved_items")
      .select("product_id")
      .eq("user_id", userId);
    setSavedIds(new Set(data?.map((s) => s.product_id) ?? []));
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchBagCount(data.user.id);
        fetchSavedIds(data.user.id);
        fetchRole(data.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchBagCount(u.id);
        fetchSavedIds(u.id);
        fetchRole(u.id);
      } else {
        setBagCount(0);
        setSavedIds(new Set());
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchBagCount, fetchSavedIds, fetchRole]);

  const toggleSaved = useCallback(async (productId: string) => {
    if (!user) { openAuthModal("signin"); return; }

    if (savedIds.has(productId)) {
      setSavedIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
      await supabase.from("saved_items").delete()
        .eq("user_id", user.id).eq("product_id", productId);
    } else {
      setSavedIds((prev) => new Set([...prev, productId]));
      await supabase.from("saved_items").insert({ user_id: user.id, product_id: productId });
    }
  }, [user, savedIds, supabase]);

  const addToBag = useCallback(async (
    productId: string,
    color?: string | null,
    size?: string | null,
  ): Promise<"added" | "auth" | "out_of_stock"> => {
    if (!user) { openAuthModal("signin"); return "auth"; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stockCheck } = await (supabase.from("products").select("in_stock").eq("id", productId).single() as any);
    if (stockCheck && !stockCheck.in_stock) return "out_of_stock";

    const c = color || null;
    const s = size || null;

    let query = supabase
      .from("bag_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId);

    query = c ? query.eq("color", c) : query.is("color", null);
    query = s ? query.eq("size", s) : query.is("size", null);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      await supabase.from("bag_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase.from("bag_items").insert({
        user_id: user.id,
        product_id: productId,
        color: c,
        size: s,
        quantity: 1,
      });
    }

    await fetchBagCount(user.id);
    return "added";
  }, [user, supabase, fetchBagCount]);

  const refreshBag = useCallback(async () => {
    if (user) await fetchBagCount(user.id);
  }, [user, fetchBagCount]);

  return (
    <UserDataContext.Provider value={{ user, role, bagCount, savedIds, toggleSaved, addToBag, refreshBag }}>
      {children}
    </UserDataContext.Provider>
  );
}
