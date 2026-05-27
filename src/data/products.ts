export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  price: string;
  img: string;
  images?: string[];
  rating: number;
  reviews: number;
  bg: string;
  inStock: boolean;
  description: string;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  highlights: string[];
  attrs?: Record<string, string[]>;
}

export const ALL_PRODUCTS: Product[] = [
  {
    id: "headphone",
    name: "Pro Noise-Cancelling Headphones",
    category: "Tech & Gadgets",
    subCategory: "Headphones & Audio",
    price: "$299",
    img: "/images/headphone_product.png",
    rating: 4.8,
    reviews: 2341,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    inStock: true,
    description: "Industry-leading noise cancellation meets premium 40-hour battery life. Adaptive sound adjusts to your environment automatically, whether you're on a plane, in the office, or outdoors.",
    colors: [
      { name: "Midnight Black", hex: "#1a1a2e" },
      { name: "Arctic White",   hex: "#f0f0f0" },
      { name: "Navy Blue",      hex: "#1e3a5f" },
    ],
    sizes: ["S", "M", "L"],
    highlights: [
      "40-hour battery with quick charge (5 min = 3 hours)",
      "Industry-leading noise cancellation",
      "Multipoint connection, pair 2 devices simultaneously",
      "Foldable design with carrying case",
    ],
    attrs: {
      connectivity: ["Bluetooth", "USB-C"],
      color: ["Midnight Black", "Arctic White", "Navy Blue"],
    },
  },
  {
    id: "sweater",
    name: "Merino Wool Sweater",
    category: "Fashion",
    subCategory: "Tops & Shirts",
    price: "$89",
    img: "/images/sweater_product.png",
    rating: 4.6,
    reviews: 891,
    bg: "bg-purple-50 dark:bg-purple-950/40",
    inStock: true,
    description: "Crafted from 100% extra-fine merino wool, this sweater offers natural temperature regulation and a buttery-soft hand feel. Relaxed fit, minimal design. A wardrobe essential.",
    colors: [
      { name: "Camel",    hex: "#c19a6b" },
      { name: "Forest",   hex: "#4a6741" },
      { name: "Charcoal", hex: "#3d3d3d" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    highlights: [
      "100% extra-fine merino wool",
      "Natural temperature regulation",
      "Machine washable on gentle cycle",
      "Relaxed, unisex fit",
    ],
    attrs: {
      size: ["XS", "S", "M", "L", "XL"],
      material: ["Wool"],
      fit: ["Relaxed"],
      color: ["Beige", "Green", "Grey"],
    },
  },
  {
    id: "serum",
    name: "Vitamin C Brightening Serum",
    category: "Beauty & Health",
    subCategory: "Skincare",
    price: "$45",
    img: "/images/serum_product.png",
    rating: 4.7,
    reviews: 1205,
    bg: "bg-pink-50 dark:bg-pink-950/40",
    inStock: false,
    description: "A potent 20% Vitamin C formula that visibly brightens skin and fades dark spots in as little as 4 weeks. Stabilised with ferulic acid for maximum efficacy and shelf life.",
    sizes: ["30ml", "60ml", "100ml"],
    highlights: [
      "20% stabilised Vitamin C + ferulic acid",
      "Visible brightening in 4 weeks",
      "Fragrance-free, dermatologist tested",
      "30ml, a 2-month supply at once-daily use",
    ],
    attrs: {
      skinType: ["All types", "Sensitive"],
      concern: ["Brightening", "Anti-aging"],
      volume: ["30ml", "60ml", "100ml"],
    },
  },
  {
    id: "crossbag",
    name: "Mini Leather Crossbody Bag",
    category: "Bags & Luggage",
    subCategory: "Crossbody Bags",
    price: "$129",
    img: "/images/crossbag_product.png",
    rating: 4.5,
    reviews: 643,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    inStock: true,
    description: "Full-grain vegetable-tanned leather that develops a rich patina over time. Fits a phone, cards, and keys. Everything you actually need. Adjustable strap wears cross-body or over the shoulder.",
    colors: [
      { name: "Tan",      hex: "#c8956c" },
      { name: "Black",    hex: "#1c1c1c" },
      { name: "Burgundy", hex: "#6d1f2f" },
    ],
    sizes: ["Mini", "Standard", "Large"],
    highlights: [
      "Full-grain vegetable-tanned leather",
      "Develops a rich patina over time",
      "Adjustable strap: 55 to 120 cm",
      "Interior zip pocket + card slots",
    ],
    attrs: {
      material: ["Leather"],
      style: ["Crossbody"],
      color: ["Tan", "Black", "Burgundy"],
      size: ["Mini", "Small", "Large"],
    },
  },
  {
    id: "coffee",
    name: "Single Origin Coffee Blend",
    category: "Food & Beverages",
    subCategory: "Coffee & Tea",
    price: "$22",
    img: "/images/coffee_product.png",
    rating: 4.9,
    reviews: 3102,
    bg: "bg-orange-50 dark:bg-orange-950/40",
    inStock: true,
    description: "Sourced directly from small farms in Yirgacheffe, Ethiopia. Light roast with notes of blueberry, jasmine, and dark chocolate. Roasted to order and shipped within 48 hours.",
    sizes: ["250g", "500g", "1kg"],
    highlights: [
      "Single origin: Yirgacheffe, Ethiopia",
      "Roasted to order, ships within 48 hours",
      "Tasting notes: blueberry, jasmine, dark chocolate",
      "Works for pour-over, Aeropress, and espresso",
    ],
    attrs: {
      weight: ["250g", "500g", "1kg"],
      roast: ["Light"],
      origin: ["Ethiopia"],
      dietary: ["Organic", "Fair trade"],
    },
  },
  {
    id: "lamp",
    name: "Minimalist Arc Floor Lamp",
    category: "Home & Living",
    subCategory: "Lighting",
    price: "$159",
    img: "/images/lamp_product.png",
    rating: 4.4,
    reviews: 428,
    bg: "bg-teal-50 dark:bg-teal-950/40",
    inStock: false,
    description: "A clean arc silhouette that works in any room. Stepless dimming via touch control on the base, warm-to-cool colour temperature range, and a weighted marble base that keeps it stable.",
    colors: [
      { name: "Brass",       hex: "#b5a642" },
      { name: "Matte Black", hex: "#2a2a2a" },
      { name: "Chrome",      hex: "#c0c0c0" },
    ],
    sizes: ["Standard", "Large"],
    highlights: [
      "Stepless dimming + warm-to-cool CCT",
      "Weighted marble base, no tipping",
      "E26 bulb socket, compatible with smart bulbs",
      "Max height 185 cm, arc reach 120 cm",
    ],
    attrs: {
      room: ["Living room", "Bedroom", "Office"],
      material: ["Metal", "Marble"],
      color: ["Brass", "Black", "Chrome"],
      size: ["Medium", "Large"],
    },
  },
];

export const TRENDING     = ["headphone", "crossbag", "sweater", "serum", "lamp", "coffee"];
export const BEST_SELLING = ["sweater", "serum", "headphone", "lamp", "coffee", "crossbag"];
export const NEW_ARRIVALS = ["lamp", "serum", "crossbag", "coffee", "headphone", "sweater"];

export const CATEGORY_BG: Record<string, string> = {
  "Tech & Gadgets": "bg-blue-50 dark:bg-blue-950/40",
  "Fashion":        "bg-purple-50 dark:bg-purple-950/40",
  "Beauty":         "bg-pink-50 dark:bg-pink-950/40",
  "Home & Living":  "bg-amber-50 dark:bg-amber-950/40",
  "Footwear":       "bg-green-50 dark:bg-green-950/40",
  "Bags":           "bg-orange-50 dark:bg-orange-950/40",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbToProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    subCategory: p.sub_category ?? undefined,
    price: String(p.price),
    img: p.img ?? "",
    images: p.images ?? undefined,
    rating: Number(p.rating ?? 0),
    reviews: Number(p.review_count ?? 0),
    bg: CATEGORY_BG[p.category] ?? "bg-gray-50 dark:bg-gray-900/40",
    inStock: p.in_stock ?? false,
    description: p.description ?? "",
    colors: Array.isArray(p.colors) ? p.colors : undefined,
    sizes: p.sizes?.length ? p.sizes : undefined,
    highlights: p.highlights ?? [],
    attrs: p.attrs ?? undefined,
  };
}
