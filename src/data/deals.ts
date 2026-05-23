export interface Deal {
  productId: string;
  salePrice: string;
  discountPct: number;
  type: "flash" | "weekly" | "clearance";
  flashDurationMs?: number;
}

export const DEALS: Deal[] = [
  { productId: "headphone", salePrice: "$224", discountPct: 25, type: "flash",     flashDurationMs: 6 * 60 * 60 * 1000 },
  { productId: "crossbag",  salePrice: "$103", discountPct: 20, type: "flash",     flashDurationMs: 6 * 60 * 60 * 1000 },
  { productId: "sweater",   salePrice: "$75",  discountPct: 15, type: "weekly" },
  { productId: "coffee",    salePrice: "$19",  discountPct: 10, type: "weekly" },
  { productId: "serum",     salePrice: "$29",  discountPct: 35, type: "clearance" },
  { productId: "lamp",      salePrice: "$95",  discountPct: 40, type: "clearance" },
];

export const FLASH_DEALS     = DEALS.filter((d) => d.type === "flash");
export const WEEKLY_DEALS    = DEALS.filter((d) => d.type === "weekly");
export const CLEARANCE_DEALS = DEALS.filter((d) => d.type === "clearance");
