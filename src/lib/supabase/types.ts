export type Role = "customer" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; role: Role; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; role?: Role };
        Update: { full_name?: string | null; role?: Role; updated_at?: string };
        Relationships: [];
      };
      bag_items: {
        Row: { id: string; user_id: string; product_id: string; quantity: number; color: string | null; size: string | null; created_at: string };
        Insert: { user_id: string; product_id: string; quantity?: number; color?: string | null; size?: string | null };
        Update: { quantity?: number; color?: string | null; size?: string | null };
        Relationships: [];
      };
      saved_items: {
        Row: { id: string; user_id: string; product_id: string; created_at: string };
        Insert: { user_id: string; product_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      products: {
        Row: { id: string; name: string; description: string | null; price: number; category: string; sub_category: string | null; rating: number; review_count: number; in_stock: boolean; img: string | null; bg: string | null; images: string[] | null; colors: unknown; sizes: string[] | null; highlights: string[] | null; attrs: unknown; created_at: string; updated_at: string };
        Insert: { id: string; name: string; price: number; category: string };
        Update: { name?: string; price?: number; category?: string };
        Relationships: [];
      };
      orders: {
        Row: { id: string; user_id: string | null; status: string; subtotal: number; shipping: number; total: number; notes: string | null; created_at: string; updated_at: string };
        Insert: { user_id: string; status?: string; subtotal: number; shipping?: number; total: number };
        Update: { status?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { role: Role };
  };
}
