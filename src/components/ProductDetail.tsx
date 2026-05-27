"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ALL_PRODUCTS, mapDbToProduct, type Product } from "@/data/products";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { useUserData } from "@/context/UserDataContext";
import { createClient } from "@/lib/supabase/client";
import { useUserCountry, useLiveCurrency } from "@/lib/currency";
import { isAccessible } from "@/lib/geo";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          fill={i <= Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor" className="text-amber-400"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform active:scale-90 hover:scale-110 p-0.5"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              fill={i <= active ? "currentColor" : "none"}
              stroke="currentColor" className="text-amber-400"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
      {active > 0 && (
        <span className="text-xs font-medium text-amber-500">{RATING_LABELS[active]}</span>
      )}
    </div>
  );
}

interface ReviewData {
  id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  name: string;
}

export function ProductDetail({ product, restrictedCountries = null }: { product: Product; restrictedCountries?: string[] | null }) {
  const { user, savedIds, toggleSaved, addToBag } = useUserData();
  const [supabase] = useState(() => createClient());
  const userCountry = useUserCountry();
  const { convert, code: currencyCode } = useLiveCurrency(userCountry);
  const [geoBlocked, setGeoBlocked] = useState(false);

  const wishlisted = savedIds.has(product.id);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [bagFeedback, setBagFeedback] = useState(false);
  const imgs = product.images?.length ? product.images : [product.img, product.img, product.img, product.img];
  const [activeImg, setActiveImg] = useState(0);
  const initialRelated = ALL_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
  const [related, setRelated] = useState<Product[]>(initialRelated);
  const [relatedLoading, setRelatedLoading] = useState(initialRelated.length === 0);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((supabase.from("products") as any).select("id, name, category, sub_category, price, img, images, in_stock, description, colors, sizes, highlights, attrs, rating, review_count").eq("published", true).neq("id", product.id).limit(6))
      .then(({ data }: { data: unknown[] | null }) => {
        if (data?.length) {
          const staticIds = new Set(ALL_PRODUCTS.map((p) => p.id));
          const mapped = (data as Parameters<typeof mapDbToProduct>[0][]).map((p) =>
            staticIds.has(p.id) ? ALL_PRODUCTS.find((sp) => sp.id === p.id)! : mapDbToProduct(p)
          );
          setRelated(mapped.filter((p) => p.id !== product.id).slice(0, 3));
        }
        setRelatedLoading(false);
      });
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [shippingFee, setShippingFee] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("products").select("shipping_fee").eq("id", product.id).single() as any)
      .then(({ data }: { data: { shipping_fee: number | null } | null }) => {
        if (data) setShippingFee(Number(data.shipping_fee ?? 0));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reviews state
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [liveRating, setLiveRating] = useState(0);
  const [liveCount, setLiveCount] = useState(0);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [editing, setEditing] = useState(false);

  const userReview = reviews.find((r) => r.user_id === user?.id);

  async function loadReviews() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: revData } = await (supabase
      .from("reviews")
      .select("id, user_id, rating, body, created_at")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false }) as any);

    if (!revData?.length) { setReviews([]); setReviewsLoaded(true); return; }

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", (revData as ReviewData[]).map((r) => r.user_id));

    const nameMap = new Map((profilesData ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));

    const mapped: ReviewData[] = (revData as ReviewData[]).map((r) => ({
      ...r,
      name: (nameMap.get(r.user_id) as string | null) ?? "Verified buyer",
    }));
    setReviews(mapped);
    setReviewsLoaded(true);

    const count = mapped.length;
    const avg = count > 0 ? Math.round((mapped.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
    setLiveRating(avg);
    setLiveCount(count);
  }

  useEffect(() => { loadReviews(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit() {
    setFormRating(userReview?.rating ?? 0);
    setFormText(userReview?.body ?? "");
    setEditing(true);
  }

  async function handleSubmit() {
    if (!user || formRating === 0) return;
    setSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsQ = supabase.from("reviews") as any;
    const { error } = await reviewsQ.upsert({
      product_id: product.id,
      user_id: user.id,
      rating: formRating,
      body: formText.trim() || null,
    }, { onConflict: "product_id,user_id" });

    if (!error) {
      await loadReviews();
      setSubmitDone(true);
      setEditing(false);
      setFormRating(0);
      setFormText("");
      setTimeout(() => setSubmitDone(false), 3000);
    }
    setSubmitting(false);
  }

  return (
    <>
      <Header />
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-125 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[-35%] w-175 h-87.5 rounded-full bg-blue-300/20 dark:bg-blue-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 min-h-screen">
        <div className="pt-28 pb-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Breadcrumb + back */}
            <div className="flex items-center justify-between">
              <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Home</Link>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                <span className="text-gray-500">{product.category}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-48">{product.name}</span>
              </nav>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back
              </Link>
            </div>

            {/* ── 2-col hero ── */}
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10 items-start">

              {/* Col 1: main image + thumbnails */}
              <div className="flex flex-col gap-3">
                <div className={`relative w-full aspect-square rounded-3xl overflow-hidden ${product.bg} [box-shadow:0_0_40px_rgba(147,197,253,0.18)]`}>
                  {imgs[activeImg] && <Image src={imgs[activeImg]} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" priority />}
                  <span className="absolute bottom-4 left-4 text-[9px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-blue-950 dark:text-blue-100">
                    {product.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  {imgs.slice(0, 4).map((src, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      style={{ WebkitTapHighlightColor: "transparent", outline: "none" }}
                      className={`relative flex-1 aspect-square rounded-xl overflow-hidden ${product.bg} transition-opacity duration-150 ${activeImg === i ? "ring-2 ring-blue-950 dark:ring-blue-200" : "opacity-60 hover:opacity-100"}`}
                    >
                      {src && <Image src={src} alt={`${product.name} view ${i + 1}`} fill className="object-cover" sizes="80px" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Col 2: product info */}
              <div className="lg:sticky lg:top-28 flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">{product.category}</p>
                  <button onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-1.5 shrink-0">
                    <Stars rating={liveRating} size={12} />
                    <span className="text-xs text-gray-400">({liveCount.toLocaleString()})</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{product.name}</h1>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-3xl font-black">{convert(product.price)}</p>
                    {currencyCode !== "USD" && <p className="text-xs text-gray-400">{product.price} USD</p>}
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex w-2 h-2">
                        {product.inStock && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
                        <span className={`w-2 h-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                      </span>
                      <span className="text-xs text-gray-500">{product.inStock ? "In stock" : "Out of stock"}</span>
                    </div>
                  </div>
                  {shippingFee !== null && (
                    <span className="text-xs text-gray-400">
                      {shippingFee > 0 ? `+ GH₵${shippingFee.toFixed(2)} shipping` : "Free shipping"}
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed">{product.description}</p>

                {product.colors && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Color: <span className="text-gray-700 dark:text-gray-300 font-semibold">{selectedColor}</span></p>
                    <div className="flex gap-2.5">
                      {product.colors.map((c, i) => (
                        <button key={`${c.name}-${i}`} title={c.name} onClick={() => setSelectedColor(c.name)}
                          className="w-7 h-7 rounded-full transition-all duration-150"
                          style={{ backgroundColor: c.hex, outline: selectedColor === c.name ? "2.5px solid #0a0a2e" : "2.5px solid transparent", outlineOffset: "3px" }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Size</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((s) => (
                        <button key={s} onClick={() => setSelectedSize(s)}
                          className={`px-3.5 py-1 text-xs font-semibold rounded-full border-2 transition-all ${selectedSize === s ? "bg-blue-950 text-white border-blue-950 dark:bg-blue-200 dark:text-blue-950 dark:border-blue-200" : "border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950/5 dark:hover:bg-blue-200/10"}`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  {geoBlocked && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      This product is not available for purchase in your region.
                    </p>
                  )}
                  <div className="flex gap-3">
                  <button
                    disabled={!product.inStock}
                    onClick={async () => {
                      if (!isAccessible(restrictedCountries, userCountry)) {
                        setGeoBlocked(true);
                        setTimeout(() => setGeoBlocked(false), 3000);
                        return;
                      }
                      const result = await addToBag(product.id, selectedColor, selectedSize);
                      if (result === "added") { setBagFeedback(true); setTimeout(() => setBagFeedback(false), 1500); }
                    }}
                    className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${
                      !product.inStock
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : bagFeedback
                          ? "bg-emerald-400 hover:bg-emerald-500 text-[#01013a] active:scale-[0.98]"
                          : "bg-blue-400 hover:bg-blue-500 text-[#01013a] active:scale-[0.98]"
                    }`}
                  >
                    {!product.inStock ? "Out of stock" : bagFeedback ? "Added!" : "Add to bag"}
                  </button>
                  <button onClick={() => toggleSaved(product.id)}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${wishlisted ? "bg-red-500 border-red-500 text-white" : "border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950/5 dark:hover:bg-blue-200/10"}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" style={{ transition: "fill 0.15s ease" }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        <FeaturedProducts title="You might also like" products={related} loading={relatedLoading} className="bg-gray-100 dark:bg-gray-900" />

        {/* Reviews */}
        <section id="reviews" className="bg-gray-100 dark:bg-gray-900 pt-12 pb-10">
          <div className="px-6 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Reviews</h2>
              <div className="flex items-center gap-2">
                <Stars rating={liveRating} size={14} />
                {liveCount > 0 && <span className="text-sm font-bold">{liveRating}</span>}
                <span className="text-xs text-gray-400">({liveCount.toLocaleString()})</span>
              </div>
            </div>

            {/* Write / edit review */}
            {user ? (
              <div className="mb-8 max-w-xl">
                {userReview && !editing ? (
                  /* User already reviewed — show their review + edit button */
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Stars rating={userReview.rating} size={13} />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Your review</span>
                        {submitDone && <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved!</span>}
                      </div>
                      <button onClick={startEdit}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Edit
                      </button>
                    </div>
                    {userReview.body && <p className="text-sm text-gray-600 dark:text-gray-400">{userReview.body}</p>}
                  </div>
                ) : (editing || !userReview) ? (
                  /* Review form */
                  <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 space-y-4 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {userReview ? "Edit your review" : "Rate this product"}
                    </p>
                    <StarPicker value={formRating} onChange={setFormRating} />
                    <textarea
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      placeholder="Share your experience (optional)"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmit}
                        disabled={formRating === 0 || submitting}
                        className="px-5 py-2 text-sm font-semibold bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-full disabled:opacity-40 transition-all active:scale-[0.98]"
                      >
                        {submitting ? "Saving…" : userReview ? "Update" : "Submit"}
                      </button>
                      {editing && (
                        <button onClick={() => setEditing(false)}
                          className="px-5 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mb-8 max-w-xl rounded-2xl bg-white dark:bg-gray-900 p-5 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Link href="/signin" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
                  {" "}to leave a review.
                </p>
              </div>
            )}

            {/* Reviews list */}
            {!reviewsLoaded ? (
              <div className="flex gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl bg-white dark:bg-gray-950 shrink-0 w-72 h-44 animate-pulse" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <svg key={i} width={20} height={20} viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      fill="none" stroke="currentColor" className="text-gray-300 dark:text-gray-700">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No reviews yet</p>
                <p className="text-xs text-gray-400 max-w-48">Be the first to share what you think about this product.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                {reviews.map((r) => (
                  <div key={r.id}
                    className={`rounded-2xl p-6 flex flex-col justify-between shrink-0 w-72 min-h-44 [box-shadow:0_2px_12px_rgba(0,0,0,0.06)] ${
                      r.user_id === user?.id
                        ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
                        : "bg-white dark:bg-gray-950"
                    }`}>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {r.body ?? <span className="italic text-gray-400">No written review</span>}
                    </p>
                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          {r.name}
                          {r.user_id === user?.id && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">You</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <Stars rating={r.rating} size={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </>
  );
}
