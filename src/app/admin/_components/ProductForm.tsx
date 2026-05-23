"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GEO_COUNTRIES } from "@/lib/geo";

const COLOR_DB: [string, number, number, number][] = [
  ["Black",        0,   0,   0],  ["White",       255, 255, 255],
  ["Red",        255,   0,   0],  ["Green",         0, 128,   0],
  ["Blue",         0,   0, 255],  ["Yellow",       255, 255,   0],
  ["Orange",     255, 165,   0],  ["Purple",       128,   0, 128],
  ["Pink",       255, 192, 203],  ["Brown",        165,  42,  42],
  ["Gray",       128, 128, 128],  ["Silver",       192, 192, 192],
  ["Gold",       255, 215,   0],  ["Beige",        245, 245, 220],
  ["Ivory",      255, 255, 240],  ["Cream",        255, 253, 208],
  ["Maroon",     128,   0,   0],  ["Navy",           0,   0, 128],
  ["Teal",         0, 128, 128],  ["Olive",        128, 128,   0],
  ["Coral",      255, 127,  80],  ["Salmon",       250, 128, 114],
  ["Crimson",    220,  20,  60],  ["Magenta",      255,   0, 255],
  ["Violet",     238, 130, 238],  ["Indigo",        75,   0, 130],
  ["Lavender",   230, 230, 250],  ["Lilac",        200, 162, 200],
  ["Mauve",      224, 176, 255],  ["Plum",         142,  69, 133],
  ["Rose",       255,   0, 127],  ["Hot Pink",     255, 105, 180],
  ["Fuchsia",    255,   0, 255],  ["Burgundy",     128,   0,  32],
  ["Wine",       114,  47,  55],  ["Rust",         183,  65,  14],
  ["Terracotta", 226, 114,  91],  ["Chocolate",    210, 105,  30],
  ["Camel",      193, 154, 107],  ["Tan",          210, 180, 140],
  ["Nude",       227, 188, 154],  ["Peach",        255, 203, 164],
  ["Champagne",  247, 231, 206],  ["Amber",        255, 191,   0],
  ["Mustard",    255, 219,  88],  ["Khaki",        240, 230, 140],
  ["Sage",       188, 191, 138],  ["Mint",         152, 255, 152],
  ["Emerald",     80, 200, 120],  ["Forest Green", 34,  139,  34],
  ["Turquoise",   64, 224, 208],  ["Aqua",           0, 255, 255],
  ["Cyan",         0, 255, 255],  ["Sky Blue",     135, 206, 235],
  ["Baby Blue",  137, 207, 240],  ["Steel Blue",    70, 130, 180],
  ["Royal Blue",  65, 105, 225],  ["Cobalt",         0,  71, 171],
  ["Denim",       21,  96, 189],  ["Midnight Blue", 25,  25, 112],
  ["Charcoal",    54,  69,  79],  ["Slate",        112, 128, 144],
];

function hexToColorName(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let best = COLOR_DB[0][0];
  let bestDist = Infinity;
  for (const [name, nr, ng, nb] of COLOR_DB) {
    // Weighted RGB — approximates human eye sensitivity (G > R > B)
    const dist = 2 * (r - nr) ** 2 + 4 * (g - ng) ** 2 + 3 * (b - nb) ** 2;
    if (dist < bestDist) { bestDist = dist; best = name; }
  }
  return best;
}

function SizeDropdown({
  label,
  sizes,
  selected,
  onAdd,
}: {
  label: string;
  sizes: string[];
  selected: string[];
  onAdd: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 transition-colors"
      >
        <span>{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-full min-w-35 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto">
          {sizes.map((s) => {
            const added = selected.includes(s);
            return (
              <button
                key={s}
                type="button"
                disabled={added}
                onClick={() => { onAdd(s); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  added
                    ? "text-gray-300 dark:text-gray-600 cursor-default"
                    : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                }`}
              >
                {s}{added && " ✓"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  "Tech & Gadgets", "Fashion", "Food & Beverages",
  "Bags & Luggage", "Beauty & Health", "Home & Living",
];

const SIZE_GROUPS = [
  { label: "Clothing",       sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
  { label: "Shoes (UK)",     sizes: ["UK 1", "UK 2", "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12", "UK 13"] },
  { label: "Shoes (EU)",     sizes: ["EU 35", "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46"] },
  { label: "Shoes (US)",     sizes: ["US 5", "US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12", "US 13"] },
  { label: "Waist / Jeans",  sizes: ['26"', '28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"'] },
  { label: "Dress sizes",    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22"] },
  { label: "Storage",        sizes: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"] },
  { label: "Other",          sizes: ["One Size", "Small", "Medium", "Large", "XS-S", "M-L", "L-XL"] },
];


type Color = { name: string; hex: string };

interface Props {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    id?: string; name?: string; description?: string; price?: number;
    category?: string; sub_category?: string; in_stock?: boolean;
    img?: string | null; images?: string[] | null; sizes?: string[] | null;
    highlights?: string[] | null; colors?: Color[] | null;
    attrs?: Record<string, string[]> | null;
    restricted_countries?: string[] | null;
    shipping_fee?: number | null;
  };
  initialPublished?: boolean;
  submitLabel?: string;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const input = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
const textarea = input + " resize-none";

export function ProductForm({ action, initial, submitLabel = "Save Product" }: Props) {
  const [pending, startTransition] = useTransition();
  const draftMode = useRef(false);
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? [""]);
  const [colors, setColors] = useState<Color[]>(initial?.colors ?? []);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initial?.images ?? []);
  const [primaryImg, setPrimaryImg] = useState(initial?.img ?? "");
  const [uploading, setUploading] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const [pendingColor, setPendingColor] = useState({ hex: "#6b7280", name: "" });
  const [pendingColorError, setPendingColorError] = useState(false);
  const [pendingColorUnknown, setPendingColorUnknown] = useState(false);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const initRC = initial?.restricted_countries;
  const [geoRestricted, setGeoRestricted] = useState(!!(initRC && initRC.length > 0));
  const [restrictedCountries, setRestrictedCountries] = useState<string[]>(initRC ?? []);
  const [customCountryInput, setCustomCountryInput] = useState("");

  function toggleCountry(code: string) {
    setRestrictedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }
  function addCustomCountry() {
    const code = customCountryInput.trim().toUpperCase().slice(0, 2);
    if (code.length === 2 && !restrictedCountries.includes(code)) {
      setRestrictedCountries((prev) => [...prev, code]);
    }
    setCustomCountryInput("");
  }

  const toggleSize = (s: string) =>
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setUploadedImages((prev) => [...prev, ...urls]);
    if (!primaryImg && urls[0]) setPrimaryImg(urls[0]);
    setUploading(false);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.set("sizes", sizes.join(","));
    fd.set("highlights", highlights.filter(Boolean).join("\n"));
    fd.set("colors", JSON.stringify(colors));
    fd.set("category", category);
    fd.set("published", draftMode.current ? "false" : "true");
    fd.set("images", uploadedImages.join("\n"));
    fd.set("img", primaryImg);
    draftMode.current = false;
    startTransition(() => action(fd));
  };

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={pending || uploading}
          onClick={() => { draftMode.current = true; formRef.current?.requestSubmit(); }}
          className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Save as Draft
        </button>
      </div>

      {/* Basic info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product ID" hint="Lowercase, hyphens only. Cannot change after creation.">
            <input name="id" defaultValue={initial?.id} required disabled={!!initial?.id}
              placeholder="e.g. wireless-earbuds"
              className={input + (initial?.id ? " opacity-50 cursor-not-allowed" : "")} />
          </Field>
          <Field label="Name">
            <input name="name" defaultValue={initial?.name} required placeholder="Product name" className={input} />
          </Field>
        </div>
        <Field label="Description">
          <textarea name="description" defaultValue={initial?.description ?? ""} rows={3}
            placeholder="Describe the product…" className={textarea} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Price (GHS)">
            <input name="price" type="number" step="0.01" min="0" defaultValue={initial?.price}
              required placeholder="0.00" className={input} />
          </Field>
          <Field label="Shipping fee (GHS)" hint="Charged per order, shown to customer.">
            <input name="shipping_fee" type="number" step="0.01" min="0"
              defaultValue={initial?.shipping_fee ?? 0}
              placeholder="0.00" className={input} />
          </Field>
          <Field label="Stock quantity">
            <input name="stock_count" type="number" min="0" step="1"
              defaultValue={(initial as { stock_count?: number })?.stock_count ?? 0}
              className={input} />
          </Field>
          <Field label="Category">
            <div ref={categoryRef} className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen((o) => !o)}
                className={`${input} flex items-center justify-between text-left ${!category ? "text-gray-400" : ""}`}
              >
                <span>{category || "Select category…"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-150 ${categoryOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {categoryOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 overflow-hidden">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCategory(c); setCategoryOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        category === c
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Subcategory">
            <input name="sub_category" defaultValue={initial?.sub_category ?? ""}
              placeholder="e.g. Headphones" className={input} />
          </Field>
        </div>

      </div>

      {/* Images */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Images</h2>
        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${uploading ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20" : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/10"}`}>
          <input type="file" accept="image/*" multiple className="sr-only"
            onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="text-sm text-gray-500">{uploading ? "Uploading…" : "Click to upload images"}</p>
        </label>

        {uploadedImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Uploaded ({uploadedImages.length}) — select primary
            </p>
            <div className="flex flex-wrap gap-3">
              {uploadedImages.map((url, i) => (
                <div key={i} className="relative group">
                  <button type="button" onClick={() => setPrimaryImg(url)}
                    className={`block w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${primaryImg === url ? "border-blue-600" : "border-gray-200 dark:border-gray-700 hover:border-blue-400"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                  {primaryImg === url && (
                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">PRIMARY</span>
                  )}
                  <button type="button"
                    onClick={() => { setUploadedImages(prev => prev.filter((_, j) => j !== i)); if (primaryImg === url) setPrimaryImg(""); }}
                    className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Field label="Or paste image URL" hint="Used as primary image on cards and product page.">
          <input value={primaryImg} onChange={(e) => setPrimaryImg(e.target.value)}
            placeholder="https://…" className={input} />
        </Field>
      </div>

      {/* Sizes */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Sizes
          {sizes.length > 0 && <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">{sizes.length} selected</span>}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SIZE_GROUPS.map((group) => (
            <SizeDropdown
              key={group.label}
              label={group.label}
              sizes={group.sizes}
              selected={sizes}
              onAdd={(s) => setSizes([...sizes, s])}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={customSizeInput}
            onChange={(e) => setCustomSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = customSizeInput.trim();
                if (v && !sizes.includes(v)) setSizes([...sizes, v]);
                setCustomSizeInput("");
              }
            }}
            placeholder="Custom size, press Enter to add"
            className={input + " flex-1"}
          />
          <button
            type="button"
            onClick={() => {
              const v = customSizeInput.trim();
              if (v && !sizes.includes(v)) setSizes([...sizes, v]);
              setCustomSizeInput("");
            }}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {sizes.map((s) => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-lg text-sm font-medium">
                {s}
                <button type="button" onClick={() => setSizes(sizes.filter((x) => x !== s))} className="opacity-60 hover:opacity-100 leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Highlights</h2>
          <button type="button" onClick={() => setHighlights([...highlights, ""])}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Add</button>
        </div>
        {highlights.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input value={h}
              onChange={(e) => setHighlights(highlights.map((x, j) => j === i ? e.target.value : x))}
              placeholder={`e.g. Premium stitching, Waterproof lining…`} className={input + " flex-1"} />
            <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-500 px-2">×</button>
          </div>
        ))}
      </div>

      {/* Colors */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Colors</h2>

        <div className="flex gap-3 items-start">
          {/* Live preview — color input overlaid directly on swatch */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700" style={{ width: 48, height: 48 }}>
              <div className="absolute inset-0" style={{ backgroundColor: pendingColor.hex }} />
              <input
                ref={colorPickerRef}
                type="color"
                value={pendingColor.hex}
                onChange={(e) => {
                  const hex = e.target.value;
                  setPendingColor((p) => ({ ...p, hex, name: hexToColorName(hex) }));
                  setPendingColorUnknown(false);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400">Picker</span>
          </div>

          {/* Name input */}
          <div className="flex-1 space-y-1">
            <input
              value={pendingColor.name}
              placeholder="Type a color name, e.g. Navy Blue, Coral Red…"
              onChange={(e) => {
                const name = e.target.value;
                setPendingColor((p) => ({ ...p, name }));
                setPendingColorError(false);

                if (!name.trim()) { setPendingColorUnknown(false); return; }

                const ctx = document.createElement("canvas").getContext("2d");
                if (!ctx) return;
                ctx.fillStyle = "#123456";
                ctx.fillStyle = name.trim();
                const resolved = ctx.fillStyle;
                if (resolved !== "#123456") {
                  setPendingColor((p) => ({ ...p, hex: resolved as string, name }));
                  setPendingColorUnknown(false);
                } else {
                  setPendingColorUnknown(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const name = pendingColor.name.trim();
                  if (!name) { setPendingColorError(true); return; }
                  setColors([...colors, { name, hex: pendingColor.hex }]);
                  setPendingColor({ hex: "#6b7280", name: "" });
                  setPendingColorUnknown(false);
                }
              }}
              className={input + (pendingColorError ? " border-red-400 ring-2 ring-red-200" : "")}
            />
            {pendingColorError && (
              <p className="text-[11px] text-red-500">Enter a color name first</p>
            )}
            {pendingColorUnknown && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Color not recognized. Use the picker to select it, then give it a name.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const name = pendingColor.name.trim();
              if (!name) { setPendingColorError(true); return; }
              setColors([...colors, { name, hex: pendingColor.hex }]);
              setPendingColor({ hex: "#6b7280", name: "" });
              setPendingColorUnknown(false);
            }}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap mt-0.5"
          >
            Add
          </button>
        </div>

        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <span key={i} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 shrink-0" style={{ background: c.hex }} />
                {c.name}
                <button type="button" onClick={() => setColors(colors.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500 leading-none ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}

        {colors.length === 0 && (
          <p className="text-xs text-gray-400">No colors yet. Leave empty if product has no variants.</p>
        )}
      </div>

      {/* Geographic availability */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Geographic availability</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="_geo_mode"
              checked={!geoRestricted}
              onChange={() => { setGeoRestricted(false); setRestrictedCountries([]); }}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Worldwide</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="_geo_mode"
              checked={geoRestricted}
              onChange={() => setGeoRestricted(true)}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Restrict to specific countries</span>
          </label>
        </div>

        {geoRestricted && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Product visible only to customers in selected countries. Leave all unchecked to block everyone.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {GEO_COUNTRIES.map(({ code, name }) => (
                <label key={code} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrictedCountries.includes(code)}
                    onChange={() => toggleCountry(code)}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    <span className="text-gray-400 mr-1">{code}</span>{name}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customCountryInput}
                onChange={(e) => setCustomCountryInput(e.target.value.toUpperCase().slice(0, 2))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCountry(); } }}
                placeholder="Other (ISO code, e.g. JP)"
                maxLength={2}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={addCustomCountry}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Add
              </button>
            </div>
            {restrictedCountries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {restrictedCountries.map((code) => {
                  const country = GEO_COUNTRIES.find((c) => c.code === code);
                  return (
                    <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                      {country ? `${code} ${country.name}` : code}
                      <button type="button" onClick={() => toggleCountry(code)} className="opacity-60 hover:opacity-100 leading-none ml-0.5">×</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <input
          type="hidden"
          name="restricted_countries"
          value={geoRestricted && restrictedCountries.length > 0 ? JSON.stringify(restrictedCountries) : "null"}
        />
      </div>

      <div className="flex justify-end gap-3">
        <a href="/admin/products"
          className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </a>
        <button type="submit" disabled={pending || uploading}
          className="px-5 py-2.5 text-sm font-medium bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-300 disabled:opacity-50 transition-colors">
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
