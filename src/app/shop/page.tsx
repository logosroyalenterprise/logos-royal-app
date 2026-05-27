"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard, ProductCardSkeleton } from "@/components/FeaturedProducts";
import { ALL_PRODUCTS, type Product, mapDbToProduct } from "@/data/products";
import { createClient } from "@/lib/supabase/client";
import { isAccessible, sanitizeCountry } from "@/lib/geo";

interface FilterGroup { key: string; label: string; options: string[] }
interface SubCategoryDef { name: string; filters: FilterGroup[] }

const SUB_CATEGORIES: Record<string, SubCategoryDef[]> = {
  "Tech & Gadgets": [
    { name: "Laptops & Computers", filters: [
      { key: "brand",      label: "Brand",       options: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Microsoft"] },
      { key: "ram",        label: "RAM",         options: ["8GB", "16GB", "32GB", "64GB"] },
      { key: "storage",    label: "Storage",     options: ["256GB", "512GB", "1TB", "2TB"] },
      { key: "screenSize", label: "Screen size", options: ['13"', '14"', '15"', '16"'] },
      { key: "processor",  label: "Processor",   options: ["Intel i5", "Intel i7", "Intel i9", "Apple M2", "Apple M3", "AMD Ryzen"] },
    ]},
    { name: "Headphones & Audio", filters: [
      { key: "brand",        label: "Brand",        options: ["Sony", "Bose", "Apple", "Sennheiser", "JBL", "Jabra"] },
      { key: "connectivity", label: "Connectivity", options: ["Bluetooth", "Wired", "USB-C", "USB-A"] },
      { key: "type",         label: "Type",         options: ["Over-ear", "On-ear", "In-ear", "True wireless"] },
      { key: "feature",      label: "Feature",      options: ["Noise cancelling", "Transparency mode", "Spatial audio", "Waterproof"] },
    ]},
    { name: "Cameras", filters: [
      { key: "brand",      label: "Brand",      options: ["Sony", "Canon", "Nikon", "Fujifilm", "Panasonic"] },
      { key: "type",       label: "Type",       options: ["DSLR", "Mirrorless", "Compact", "Action", "Instant"] },
      { key: "megapixels", label: "Megapixels", options: ["12MP", "20MP", "24MP", "33MP", "45MP+"] },
      { key: "sensor",     label: "Sensor",     options: ["Full frame", "APS-C", "Micro 4/3", "1 inch"] },
    ]},
    { name: "Smart Home", filters: [
      { key: "brand",         label: "Brand",     options: ["Amazon", "Google", "Apple", "Samsung", "Philips"] },
      { key: "compatibility", label: "Works with", options: ["Alexa", "Google Home", "Apple HomeKit", "Matter"] },
      { key: "type",          label: "Type",      options: ["Smart speaker", "Smart display", "Smart bulb", "Smart plug", "Thermostat"] },
    ]},
    { name: "Accessories", filters: [
      { key: "type",          label: "Type",           options: ["Cases", "Cables", "Chargers", "Stands", "Keyboards", "Mice"] },
      { key: "compatibility", label: "Compatible with", options: ["iPhone", "Android", "MacBook", "iPad", "Universal"] },
    ]},
  ],
  "Fashion": [
    { name: "Tops & Shirts", filters: [
      { key: "size",     label: "Size",     options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { key: "material", label: "Material", options: ["Cotton", "Wool", "Linen", "Silk", "Synthetic"] },
      { key: "fit",      label: "Fit",      options: ["Slim", "Regular", "Relaxed", "Oversized"] },
      { key: "color",    label: "Color",    options: ["Black", "White", "Navy", "Grey", "Beige", "Green"] },
    ]},
    { name: "Bottoms", filters: [
      { key: "size",     label: "Waist",    options: ["28", "30", "32", "34", "36", "38"] },
      { key: "material", label: "Material", options: ["Denim", "Chino", "Linen", "Wool", "Synthetic"] },
      { key: "fit",      label: "Fit",      options: ["Skinny", "Slim", "Regular", "Relaxed", "Wide leg"] },
      { key: "color",    label: "Color",    options: ["Black", "Blue", "Grey", "White", "Khaki", "Navy"] },
    ]},
    { name: "Outerwear", filters: [
      { key: "size",     label: "Size",     options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { key: "material", label: "Material", options: ["Wool", "Down", "Leather", "Nylon", "Cotton"] },
      { key: "type",     label: "Type",     options: ["Coat", "Jacket", "Blazer", "Puffer", "Trench"] },
      { key: "feature",  label: "Weather",  options: ["Waterproof", "Wind resistant", "Insulated", "Lightweight"] },
    ]},
    { name: "Dresses", filters: [
      { key: "size",     label: "Size",     options: ["XS", "S", "M", "L", "XL"] },
      { key: "length",   label: "Length",   options: ["Mini", "Midi", "Maxi"] },
      { key: "occasion", label: "Occasion", options: ["Casual", "Formal", "Party", "Beach", "Office"] },
      { key: "material", label: "Material", options: ["Cotton", "Silk", "Linen", "Jersey", "Chiffon"] },
    ]},
    { name: "Accessories", filters: [
      { key: "type",     label: "Type",     options: ["Scarves", "Belts", "Hats", "Sunglasses", "Jewellery", "Socks"] },
      { key: "material", label: "Material", options: ["Leather", "Gold", "Silver", "Fabric", "Stainless steel"] },
    ]},
  ],
  "Food & Beverages": [
    { name: "Coffee & Tea", filters: [
      { key: "type",    label: "Type",        options: ["Coffee", "Green tea", "Black tea", "Herbal", "Matcha"] },
      { key: "roast",   label: "Roast level", options: ["Light", "Medium-light", "Medium", "Medium-dark", "Dark"] },
      { key: "origin",  label: "Origin",      options: ["Ethiopia", "Colombia", "Brazil", "Kenya", "Japan", "Sri Lanka"] },
      { key: "weight",  label: "Weight",      options: ["100g", "250g", "500g", "1kg"] },
      { key: "dietary", label: "Dietary",     options: ["Organic", "Fair trade", "Single origin", "Decaf"] },
    ]},
    { name: "Snacks", filters: [
      { key: "type",    label: "Type",    options: ["Chips", "Nuts", "Dried fruit", "Granola", "Chocolate", "Crackers"] },
      { key: "dietary", label: "Dietary", options: ["Vegan", "Gluten-free", "Organic", "Sugar-free", "Nut-free"] },
      { key: "weight",  label: "Weight",  options: ["50g", "100g", "200g", "500g"] },
    ]},
    { name: "Beverages", filters: [
      { key: "type",    label: "Type",    options: ["Juice", "Sparkling water", "Energy drink", "Sports drink", "Kombucha"] },
      { key: "dietary", label: "Dietary", options: ["Sugar-free", "Organic", "Vegan", "No artificial flavours"] },
      { key: "volume",  label: "Volume",  options: ["250ml", "330ml", "500ml", "750ml", "1L"] },
    ]},
    { name: "Pantry Staples", filters: [
      { key: "type",    label: "Type",    options: ["Oils", "Vinegars", "Sauces", "Spices", "Grains", "Pasta"] },
      { key: "dietary", label: "Dietary", options: ["Organic", "Gluten-free", "Vegan", "Non-GMO"] },
      { key: "weight",  label: "Weight",  options: ["100g", "250g", "500g", "1kg"] },
    ]},
    { name: "Organic", filters: [
      { key: "certification", label: "Certification", options: ["USDA Organic", "EU Organic", "Fairtrade", "Rainforest Alliance"] },
      { key: "type",          label: "Type",          options: ["Produce", "Dairy alternatives", "Grains", "Snacks", "Beverages"] },
    ]},
  ],
  "Bags & Luggage": [
    { name: "Crossbody Bags", filters: [
      { key: "material", label: "Material", options: ["Leather", "Vegan leather", "Canvas", "Nylon", "Suede"] },
      { key: "color",    label: "Color",    options: ["Black", "Tan", "Brown", "Burgundy", "Navy", "Beige"] },
      { key: "size",     label: "Size",     options: ["Mini", "Small", "Medium", "Large"] },
      { key: "closure",  label: "Closure",  options: ["Zip", "Flap", "Magnetic", "Buckle"] },
    ]},
    { name: "Backpacks", filters: [
      { key: "material", label: "Material", options: ["Nylon", "Canvas", "Leather", "Recycled"] },
      { key: "capacity", label: "Capacity", options: ["10L", "15L", "20L", "25L", "30L+"] },
      { key: "feature",  label: "Feature",  options: ["Laptop compartment", "Waterproof", "Anti-theft", "USB port"] },
      { key: "color",    label: "Color",    options: ["Black", "Navy", "Grey", "Green", "Brown"] },
    ]},
    { name: "Totes", filters: [
      { key: "material", label: "Material", options: ["Canvas", "Leather", "Jute", "Nylon", "Recycled"] },
      { key: "size",     label: "Size",     options: ["Small", "Medium", "Large", "XL"] },
      { key: "color",    label: "Color",    options: ["Black", "Beige", "Navy", "White", "Natural"] },
    ]},
    { name: "Travel Bags", filters: [
      { key: "type",     label: "Type",     options: ["Carry-on", "Check-in", "Duffel", "Weekender"] },
      { key: "capacity", label: "Capacity", options: ["20L", "30L", "40L", "55L", "70L+"] },
      { key: "material", label: "Material", options: ["Polycarbonate", "Nylon", "Canvas", "Leather"] },
      { key: "feature",  label: "Feature",  options: ["Spinner wheels", "TSA lock", "Expandable", "USB port"] },
    ]},
    { name: "Wallets", filters: [
      { key: "material", label: "Material", options: ["Leather", "Vegan leather", "Canvas", "Metal"] },
      { key: "type",     label: "Type",     options: ["Bifold", "Trifold", "Card holder", "Zip-around", "Money clip"] },
      { key: "feature",  label: "Feature",  options: ["RFID blocking", "Coin pocket", "Slim profile"] },
    ]},
  ],
  "Beauty & Health": [
    { name: "Skincare", filters: [
      { key: "skinType",   label: "Skin type",    options: ["Oily", "Dry", "Combination", "Sensitive", "All types"] },
      { key: "concern",    label: "Concern",      options: ["Brightening", "Anti-aging", "Hydration", "Acne", "Pores", "Redness"] },
      { key: "type",       label: "Product type", options: ["Cleanser", "Toner", "Serum", "Moisturiser", "SPF", "Eye cream", "Mask"] },
      { key: "volume",     label: "Volume",       options: ["15ml", "30ml", "50ml", "100ml", "150ml"] },
      { key: "ingredient", label: "Key ingredient", options: ["Vitamin C", "Retinol", "Hyaluronic acid", "Niacinamide", "Peptides"] },
    ]},
    { name: "Haircare", filters: [
      { key: "hairType", label: "Hair type", options: ["Straight", "Wavy", "Curly", "Coily", "Fine", "Thick"] },
      { key: "concern",  label: "Concern",   options: ["Frizz", "Damage", "Volume", "Colour treated", "Dandruff", "Dry"] },
      { key: "type",     label: "Product",   options: ["Shampoo", "Conditioner", "Mask", "Oil", "Serum", "Spray"] },
    ]},
    { name: "Wellness", filters: [
      { key: "type",    label: "Type",    options: ["Vitamins", "Supplements", "Protein", "Probiotics", "Adaptogens"] },
      { key: "goal",    label: "Goal",    options: ["Energy", "Sleep", "Immunity", "Focus", "Gut health", "Recovery"] },
      { key: "dietary", label: "Dietary", options: ["Vegan", "Gluten-free", "Non-GMO", "Sugar-free"] },
    ]},
    { name: "Fragrance", filters: [
      { key: "type",   label: "Type",        options: ["Eau de parfum", "Eau de toilette", "Body mist", "Oil"] },
      { key: "family", label: "Scent family", options: ["Floral", "Woody", "Fresh", "Oriental", "Citrus", "Aquatic"] },
      { key: "volume", label: "Volume",      options: ["30ml", "50ml", "75ml", "100ml"] },
    ]},
    { name: "Tools", filters: [
      { key: "type",    label: "Type",    options: ["Hair dryer", "Straightener", "Curling iron", "Facial roller", "Gua sha", "LED mask"] },
      { key: "feature", label: "Feature", options: ["Ionic", "Ceramic", "Titanium", "Cordless", "USB rechargeable"] },
    ]},
  ],
  "Home & Living": [
    { name: "Lighting", filters: [
      { key: "type",     label: "Type",     options: ["Floor lamp", "Table lamp", "Pendant", "Wall light", "LED strip"] },
      { key: "material", label: "Material", options: ["Metal", "Marble", "Wood", "Glass", "Ceramic"] },
      { key: "color",    label: "Finish",   options: ["Black", "White", "Brass", "Chrome", "Natural"] },
      { key: "feature",  label: "Feature",  options: ["Dimmable", "Smart", "USB port", "Colour temperature"] },
    ]},
    { name: "Furniture", filters: [
      { key: "room",     label: "Room",     options: ["Living room", "Bedroom", "Office", "Dining room", "Outdoor"] },
      { key: "material", label: "Material", options: ["Solid wood", "MDF", "Metal", "Upholstered", "Marble"] },
      { key: "color",    label: "Color",    options: ["Black", "White", "Natural", "Walnut", "Oak", "Grey"] },
      { key: "style",    label: "Style",    options: ["Minimalist", "Scandinavian", "Industrial", "Mid-century", "Boho"] },
    ]},
    { name: "Decor", filters: [
      { key: "type",     label: "Type",     options: ["Vases", "Candles", "Mirrors", "Artwork", "Rugs", "Cushions"] },
      { key: "material", label: "Material", options: ["Ceramic", "Glass", "Wood", "Fabric", "Metal", "Marble"] },
      { key: "color",    label: "Color",    options: ["Neutral", "Black", "White", "Earth tones", "Bold"] },
    ]},
    { name: "Kitchen", filters: [
      { key: "type",    label: "Type",    options: ["Cookware", "Knives", "Storage", "Small appliances", "Dinnerware"] },
      { key: "material", label: "Material", options: ["Stainless steel", "Cast iron", "Ceramic", "Wood", "Silicone"] },
      { key: "feature",  label: "Feature",  options: ["Dishwasher safe", "Induction compatible", "Oven safe", "BPA-free"] },
    ]},
    { name: "Storage", filters: [
      { key: "room",     label: "Room",     options: ["Bedroom", "Kitchen", "Bathroom", "Office", "Living room"] },
      { key: "material", label: "Material", options: ["Wood", "Fabric", "Metal", "Plastic", "Woven"] },
      { key: "type",     label: "Type",     options: ["Baskets", "Boxes", "Shelving", "Hangers", "Drawers"] },
    ]},
  ],
};

const PRICE_RANGES = [
  { label: "Under $50",    min: 0,   max: 50 },
  { label: "$50 – $100",  min: 50,  max: 100 },
  { label: "$100 – $200", min: 100, max: 200 },
  { label: "Over $200",   min: 200, max: Infinity },
];
const RATINGS = [4.5, 4.0, 3.5];
const SORTS = [
  { label: "Featured",  value: "default" },
  { label: "Price",     value: "price" },
  { label: "Top rated", value: "rating" },
  { label: "A – Z",     value: "name-asc" },
];

interface Filters {
  categories: string[];
  subCategory: string | null;
  priceRange: string | null;
  customMin: string;
  customMax: string;
  minRating: number | null;
  inStockOnly: boolean;
  attrs: Record<string, string[]>;
}

const DEFAULT_FILTERS: Filters = { categories: [], subCategory: null, priceRange: null, customMin: "", customMax: "", minRating: null, inStockOnly: false, attrs: {} };

function activeCount(f: Filters) {
  const customActive = f.priceRange === "custom" && (f.customMin !== "" || f.customMax !== "");
  const attrCount = Object.values(f.attrs).filter((v) => v.length > 0).length;
  return (
    f.categories.length +
    (f.subCategory ? 1 : 0) +
    (f.priceRange && f.priceRange !== "custom" ? 1 : 0) +
    (customActive ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.inStockOnly ? 1 : 0) +
    attrCount
  );
}

function parsePrice(p: string) { return parseFloat(p.replace(/[^0-9.]/g, "")); }

function buildURL(f: Filters, q: string, s: string): string {
  const p = new URLSearchParams();
  if (f.categories.length)    p.set("category", f.categories.join("|"));
  if (f.subCategory)           p.set("sub", f.subCategory);
  if (q)                       p.set("q", q);
  if (f.priceRange)            p.set("price", f.priceRange);
  if (f.priceRange === "custom" && f.customMin) p.set("priceMin", f.customMin);
  if (f.priceRange === "custom" && f.customMax) p.set("priceMax", f.customMax);
  if (f.minRating)             p.set("rating", String(f.minRating));
  if (f.inStockOnly)           p.set("inStock", "1");
  if (s !== "default")         p.set("sort", s);
  const attrPairs = Object.entries(f.attrs).flatMap(([k, vs]) => vs.map((v) => `${k}:${v}`));
  if (attrPairs.length)        p.set("attrs", attrPairs.join(","));
  return p.toString();
}

function parseURLFilters(sp: URLSearchParams): { filters: Filters; query: string; sort: string } {
  let f = DEFAULT_FILTERS;
  const cat = sp.get("category");
  const sub = sp.get("sub");
  const price = sp.get("price");
  const rating = sp.get("rating");
  if (cat) {
    const cats = cat.split("|").filter(Boolean);
    if (cats.length) f = { ...f, categories: cats };
  }
  if (sub)    f = { ...f, subCategory: sub };
  if (price)  f = { ...f, priceRange: price, customMin: sp.get("priceMin") ?? "", customMax: sp.get("priceMax") ?? "" };
  if (rating) f = { ...f, minRating: parseFloat(rating) };
  if (sp.get("inStock")) f = { ...f, inStockOnly: true };
  const attrsParam = sp.get("attrs");
  if (attrsParam) {
    const attrs: Record<string, string[]> = {};
    attrsParam.split(",").forEach((entry) => {
      const idx = entry.indexOf(":");
      if (idx > 0) {
        const k = entry.slice(0, idx);
        const v = entry.slice(idx + 1);
        if (!attrs[k]) attrs[k] = [];
        attrs[k].push(v);
      }
    });
    f = { ...f, attrs };
  }
  return { filters: f, query: sp.get("q") ?? "", sort: sp.get("sort") ?? "default" };
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`}
        className="w-3.5 h-3.5 rounded-full bg-white/20 dark:bg-blue-950/20 flex items-center justify-center hover:bg-white/40 dark:hover:bg-blue-950/40 transition-colors shrink-0">
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </span>
  );
}

function FilterChips({ filters, searchQuery, sort, onChange, onClearSearch, onClearSort }: {
  filters: Filters; searchQuery: string; sort: string;
  onChange: (f: Filters) => void; onClearSearch: () => void; onClearSort: () => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];
  if (searchQuery) chips.push({ label: `"${searchQuery}"`, onRemove: onClearSearch });
  filters.categories.forEach((cat) =>
    chips.push({ label: cat, onRemove: () => onChange({ ...filters, categories: filters.categories.filter((c) => c !== cat), subCategory: null, attrs: {} }) })
  );
  if (filters.subCategory) chips.push({ label: filters.subCategory, onRemove: () => onChange({ ...filters, subCategory: null, attrs: {} }) });
  if (filters.priceRange) chips.push({
    label: filters.priceRange === "custom" ? `$${filters.customMin || "0"} – $${filters.customMax || "∞"}` : filters.priceRange,
    onRemove: () => onChange({ ...filters, priceRange: null, customMin: "", customMax: "" }),
  });
  if (filters.minRating) chips.push({ label: `${filters.minRating}+ stars`, onRemove: () => onChange({ ...filters, minRating: null }) });
  if (filters.inStockOnly) chips.push({ label: "In stock", onRemove: () => onChange({ ...filters, inStockOnly: false }) });
  Object.entries(filters.attrs).forEach(([key, vals]) =>
    vals.forEach((val) => chips.push({ label: val, onRemove: () => {
      const next = vals.filter((v) => v !== val);
      const attrs = { ...filters.attrs, [key]: next };
      if (!next.length) delete attrs[key];
      onChange({ ...filters, attrs });
    }}))
  );
  const sortLabel = sort === "price-asc" ? "Price ↑" : sort === "price-desc" ? "Price ↓"
    : sort === "rating" ? "Top rated" : sort === "name-asc" ? "A – Z ↑" : sort === "name-desc" ? "Z – A ↓" : null;
  if (sortLabel) chips.push({ label: sortLabel, onRemove: onClearSort });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {chips.map((c, i) => <Chip key={i} label={c.label} onRemove={c.onRemove} />)}
    </div>
  );
}

function FilterPanel({ filters, onChange, onClose, categoryCounts, effectiveSubCat, sort, onSortChange, categories }: {
  filters: Filters; onChange: (f: Filters) => void; onClose?: () => void;
  categoryCounts: Record<string, number>; effectiveSubCat: string | null;
  sort?: string; onSortChange?: (s: string) => void; categories: string[];
}) {
  const toggle = (cat: string) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: cats, subCategory: null, attrs: {} });
  };
  const toggleSubCat = (name: string) => onChange({ ...filters, subCategory: filters.subCategory === name ? null : name, attrs: {} });
  const togglePrice = (label: string) => onChange({ ...filters, priceRange: filters.priceRange === label ? null : label });
  const toggleRating = (r: number) => onChange({ ...filters, minRating: filters.minRating === r ? null : r });
  const toggleAttr = (key: string, val: string) => {
    const cur = filters.attrs[key] ?? [];
    const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
    const attrs = { ...filters.attrs, [key]: next };
    if (attrs[key].length === 0) delete attrs[key];
    onChange({ ...filters, attrs });
  };
  const singleCat = filters.categories.length === 1 ? filters.categories[0] : null;
  const subCatDefs: SubCategoryDef[] = singleCat ? (SUB_CATEGORIES[singleCat] ?? []) : [];
  const activeSubDef = subCatDefs.find((s) => s.name === effectiveSubCat) ?? Object.values(SUB_CATEGORIES).flat().find((s) => s.name === effectiveSubCat) ?? null;
  const isInferred = effectiveSubCat !== null && effectiveSubCat !== filters.subCategory;

  const Radio = ({ active }: { active: boolean }) => (
    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? "bg-blue-950 dark:bg-blue-200 border-blue-950 dark:border-blue-200" : "border-blue-950 dark:border-blue-200"}`}>
      {active && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-blue-950"><path d="M20 6L9 17l-5-5"/></svg>}
    </span>
  );

  return (
    <div className="flex flex-col gap-7">
      {onClose && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Filters</p>
          <button onClick={onClose} aria-label="Close filters" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      {onSortChange && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-3">Sort</p>
          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => {
              const isPrice = s.value === "price"; const isName = s.value === "name-asc";
              const priceActive = sort === "price-asc" || sort === "price-desc";
              const nameActive  = sort === "name-asc"  || sort === "name-desc";
              const active = isPrice ? priceActive : isName ? nameActive : sort === s.value;
              const label = isPrice ? (sort === "price-desc" ? "Price ↓" : priceActive ? "Price ↑" : "Price")
                : isName ? (sort === "name-desc" ? "Z – A ↓" : nameActive ? "A – Z ↑" : "A – Z") : s.label;
              const handleClick = isPrice ? () => onSortChange(sort === "price-asc" ? "price-desc" : "price-asc")
                : isName ? () => onSortChange(sort === "name-asc" ? "name-desc" : "name-asc")
                : () => onSortChange(s.value);
              return (
                <button key={s.value} onClick={handleClick}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border-2 transition-all ${active ? "bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 border-blue-950 dark:border-blue-200" : "border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950/5 dark:hover:bg-blue-200/10"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-3">Category</p>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => {
            const n = categoryCounts[cat] ?? 0; const checked = filters.categories.includes(cat);
            return (
              <label key={cat} className={`flex items-center gap-3 cursor-pointer group ${n === 0 && !checked ? "opacity-40" : ""}`} onClick={() => toggle(cat)}>
                <Radio active={checked} />
                <span className="text-sm flex-1">{cat}</span>
                <span className="text-[10px] text-gray-400 tabular-nums">{n}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-3">Price</p>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.label} className="flex items-center gap-3 cursor-pointer" onClick={() => togglePrice(r.label)}>
              <Radio active={filters.priceRange === r.label} /><span className="text-sm">{r.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => togglePrice("custom")}>
            <Radio active={filters.priceRange === "custom"} /><span className="text-sm">Custom</span>
          </label>
          {filters.priceRange === "custom" && (
            <div className="flex items-center gap-2 pl-7" onClick={(e) => e.stopPropagation()}>
              <input type="number" min="0" placeholder="Min" value={filters.customMin} onChange={(e) => onChange({ ...filters, customMin: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-full border-2 border-blue-950 dark:border-blue-200 bg-transparent focus:outline-none focus:border-[3px] transition-all tabular-nums" />
              <span className="text-xs text-gray-400 shrink-0">–</span>
              <input type="number" min="0" placeholder="Max" value={filters.customMax} onChange={(e) => onChange({ ...filters, customMax: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-full border-2 border-blue-950 dark:border-blue-200 bg-transparent focus:outline-none focus:border-[3px] transition-all tabular-nums" />
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-3">Min rating</p>
        <div className="flex flex-col gap-2">
          {RATINGS.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleRating(r)}>
              <Radio active={filters.minRating === r} /><span className="text-sm">{r}+ stars</span>
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer" onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}>
        <Radio active={filters.inStockOnly} /><span className="text-sm">In stock only</span>
      </label>
      {(subCatDefs.length > 0 || (effectiveSubCat && !singleCat)) && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-3">Sub-category</p>
          <div className="flex flex-col gap-2">
            {(subCatDefs.length > 0 ? subCatDefs : (activeSubDef ? [activeSubDef] : [])).map((s) => {
              const active = s.name === effectiveSubCat;
              return (
                <label key={s.name} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSubCat(s.name)}>
                  <Radio active={active} />
                  <span className="text-sm flex-1">{s.name}</span>
                  {active && isInferred && <span className="text-[9px] text-gray-400 font-medium">auto</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
      {activeSubDef && activeSubDef.filters.map((group) => {
        const selected = filters.attrs[group.key] ?? [];
        return (
          <div key={group.key}>
            <p className="text-xs font-semibold text-gray-400 mb-3">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => (
                <button key={opt} onClick={() => toggleAttr(group.key, opt)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border-2 transition-all ${selected.includes(opt) ? "bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 border-blue-950 dark:border-blue-200" : "border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950/5 dark:hover:bg-blue-200/10"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {activeCount(filters) > 0 && (
        <button onClick={() => onChange(DEFAULT_FILTERS)} className="w-full py-2 text-xs font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
          Clear all
        </button>
      )}
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isWritingURL = useRef(false);

  const [filters, setFilters] = useState<Filters>(() => parseURLFilters(searchParams).filters);
  const [searchQuery, setSearchQuery] = useState(() => parseURLFilters(searchParams).query);
  const [sort, setSort] = useState(() => parseURLFilters(searchParams).sort);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const count = activeCount(filters);

  // Products from Supabase (admin-created, not in static array)
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("products") as any)
      .select("id, name, category, sub_category, price, img, images, in_stock, description, colors, sizes, highlights, attrs, rating, review_count")
      .eq("published", true)
      .then(({ data }: { data: any[] | null }) => {
        if (data) {
          const staticIds = new Set(ALL_PRODUCTS.map((p) => p.id));
          setDbProducts(data.filter((p) => !staticIds.has(p.id)).map(mapDbToProduct));
        }
        setDbLoading(false);
      });
  }, []);

  const allProducts = useMemo(() => [...ALL_PRODUCTS, ...dbProducts], [dbProducts]);
  const allCategories = useMemo(() => Array.from(new Set(allProducts.map((p) => p.category))), [allProducts]);

  // Real ratings from Supabase (overrides static mock data)
  const [ratingsMap, setRatingsMap] = useState<Map<string, { rating: number; count: number }>>(new Map());
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("id, rating, review_count")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any[] | null }) => {
        if (!data) return;
        setRatingsMap(new Map(data.map((r) => [r.id as string, { rating: Number(r.rating ?? 0), count: Number(r.review_count ?? 0) }])));
      });
  }, []);

  // Geographic restriction: hide products not available in user's browse location
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [geoHiddenCount, setGeoHiddenCount] = useState(0);
  useEffect(() => {
    const prefLoc = document.cookie.match(/(?:^|;\s*)preferred-location=([^;]+)/)?.[1];
    const realRaw = document.cookie.match(/(?:^|;\s*)user-country=([^;]+)/)?.[1];
    const userCountry =
      sanitizeCountry(prefLoc ? decodeURIComponent(prefLoc) : null) ??
      sanitizeCountry(realRaw ? decodeURIComponent(realRaw) : null) ??
      sanitizeCountry(process.env.NEXT_PUBLIC_GEO_TEST_COUNTRY ?? null);
    if (!userCountry) return;
    const supabase = createClient();
    supabase
      .from("products")
      .select("id, restricted_countries")
      .not("restricted_countries", "is", null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any[] | null }) => {
        if (!data) return;
        const blocked = new Set<string>(
          data
            .filter((p) => !isAccessible(p.restricted_countries, userCountry))
            .map((p) => p.id as string)
        );
        setBlockedIds(blocked);
        setGeoHiddenCount(blocked.size);
      });
  }, []);

  useEffect(() => {
    isWritingURL.current = true;
    const qs = buildURL(filters, searchQuery, sort);
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
    const t = setTimeout(() => { isWritingURL.current = false; }, 100);
    return () => clearTimeout(t);
  }, [filters, searchQuery, sort, router]);

  useEffect(() => {
    if (isWritingURL.current) return;
    const { filters: f, query: q, sort: s } = parseURLFilters(searchParams);
    setFilters(f); setSearchQuery(q); setSort(s);
  }, [searchParams]);

  const inferredSubCat = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const matches = allProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.subCategory ?? "").toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    if (matches.length === 0) return null;
    const subCats = new Set(matches.map((p) => p.subCategory).filter(Boolean));
    return subCats.size === 1 ? (Array.from(subCats)[0] as string) : null;
  }, [searchQuery]);

  const effectiveSubCat = filters.subCategory ?? inferredSubCat;

  const categoryCounts = useMemo(() => Object.fromEntries(
    allCategories.map((cat) => [cat, allProducts.filter((p) => {
      if (blockedIds.has(p.id)) return false;
      if (p.category !== cat) return false;
      const q = searchQuery.trim().toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !(p.subCategory ?? "").toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.minRating && p.rating < filters.minRating) return false;
      if (filters.priceRange) {
        const price = parsePrice(p.price);
        if (filters.priceRange === "custom") { const lo = filters.customMin !== "" ? parseFloat(filters.customMin) : 0; const hi = filters.customMax !== "" ? parseFloat(filters.customMax) : Infinity; if (price < lo || price > hi) return false; }
        else { const range = PRICE_RANGES.find((r) => r.label === filters.priceRange)!; if (price < range.min || price > range.max) return false; }
      }
      return true;
    }).length])
  ), [allCategories, allProducts, blockedIds, searchQuery, filters.inStockOnly, filters.minRating, filters.priceRange, filters.customMin, filters.customMax]);

  const products = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = allProducts.filter((p) => {
      if (blockedIds.has(p.id)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.subCategory ?? "").toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (filters.categories.length && !filters.categories.includes(p.category)) return false;
      if (filters.subCategory && p.subCategory !== filters.subCategory) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.minRating && p.rating < filters.minRating) return false;
      if (filters.priceRange) {
        const price = parsePrice(p.price);
        if (filters.priceRange === "custom") { const lo = filters.customMin !== "" ? parseFloat(filters.customMin) : 0; const hi = filters.customMax !== "" ? parseFloat(filters.customMax) : Infinity; if (price < lo || price > hi) return false; }
        else { const range = PRICE_RANGES.find((r) => r.label === filters.priceRange)!; if (price < range.min || price > range.max) return false; }
      }
      for (const [key, vals] of Object.entries(filters.attrs)) {
        if (vals.length === 0) continue;
        if (!vals.some((v) => (p.attrs?.[key] ?? []).includes(v))) return false;
      }
      return true;
    });
    if (sort === "price-asc")  list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sort === "price-desc") list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sort === "rating")     list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "name-asc")  list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [filters, sort, searchQuery]);

  return (
    <>
      <Header />
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-80 h-full bg-white dark:bg-gray-950 overflow-y-auto p-6 [box-shadow:-8px_0_40px_rgba(0,0,0,0.12)]">
            <FilterPanel filters={filters} onChange={setFilters} onClose={() => setDrawerOpen(false)} categoryCounts={categoryCounts} effectiveSubCat={effectiveSubCat} sort={sort} onSortChange={setSort} categories={allCategories} />
          </div>
        </div>
      )}
      <main className="pt-28 pb-24 md:pb-16 min-h-screen">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Shop</h1>
                <p className="text-sm text-gray-500 mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDrawerOpen(true)} className="lg:hidden relative flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950/5 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
                  Filters
                  {count > 0 && <span className="w-4 h-4 rounded-full bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 text-[9px] font-bold flex items-center justify-center">{count}</span>}
                </button>
                {SORTS.map((s) => {
                  const isPrice = s.value === "price"; const isName = s.value === "name-asc";
                  const priceActive = sort === "price-asc" || sort === "price-desc"; const nameActive = sort === "name-asc" || sort === "name-desc";
                  const active = isPrice ? priceActive : isName ? nameActive : sort === s.value;
                  const label = isPrice ? (sort === "price-desc" ? "Price ↓" : priceActive ? "Price ↑" : "Price") : isName ? (sort === "name-desc" ? "Z – A ↓" : nameActive ? "A – Z ↑" : "A – Z") : s.label;
                  const handleClick = isPrice ? () => setSort(sort === "price-asc" ? "price-desc" : "price-asc") : isName ? () => setSort(sort === "name-asc" ? "name-desc" : "name-asc") : () => setSort(s.value);
                  return <button key={s.value} onClick={handleClick} className={`hidden sm:block px-3.5 py-1.5 text-xs font-semibold rounded-full border-2 transition-all ${active ? "bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 border-blue-950 dark:border-blue-200" : "border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950/5 dark:hover:bg-blue-200/10"}`}>{label}</button>;
                })}
              </div>
            </div>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="search" aria-label="Search products" placeholder="Find literally anything..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2.5 text-sm rounded-full border-2 border-blue-950 dark:border-blue-200 bg-transparent focus:outline-none focus:border-[3px] transition-all" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-950/10 dark:bg-blue-200/10 flex items-center justify-center hover:bg-blue-950/20 dark:hover:bg-blue-200/20 transition-colors">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>
          <FilterChips filters={filters} searchQuery={searchQuery} sort={sort} onChange={setFilters} onClearSearch={() => setSearchQuery("")} onClearSort={() => setSort("default")} />
          <div className="flex gap-10 items-start">
            <aside className="hidden lg:block w-52 shrink-0 sticky top-28">
              <p className="text-sm font-semibold mb-6">Filters{count > 0 && <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950">{count}</span>}</p>
              <FilterPanel filters={filters} onChange={setFilters} categoryCounts={categoryCounts} effectiveSubCat={effectiveSubCat} categories={allCategories} />
            </aside>
            <div className="flex-1 min-w-0">
              {geoHiddenCount > 0 && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                  {geoHiddenCount} product{geoHiddenCount > 1 ? "s are" : " is"} hidden in your current location.{" "}
                  <a href="/settings" className="underline font-medium">Update your browse location in Settings</a> to see more.
                </div>
              )}
              {dbLoading && products.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight">Oopsie!</p>
                  <p className="text-sm text-gray-500">{searchQuery ? `We couldn't find anything for "${searchQuery}".` : "We couldn't find anything matching those filters."}</p>
                  <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearchQuery(""); setSort("default"); }} className="text-xs font-semibold px-4 py-2 rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">Clear filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product, i) => {
                    const real = ratingsMap.get(product.id);
                    const p = real ? { ...product, rating: real.rating, reviews: real.count } : { ...product, reviews: 0 };
                    return <ProductCard key={product.id} product={p} sectionTitle="shop" index={i} />;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
