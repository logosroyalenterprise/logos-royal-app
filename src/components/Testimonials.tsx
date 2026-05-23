"use client";

import { useState } from "react";

const TESTIMONIALS = [
  {
    name: "Alex R.", rating: 5,
    segments: [
      { text: "Shopping here changed how I discover products. The ", h: false },
      { text: "curation is unlike anything else", h: true },
      { text: " I've found online.", h: false },
    ],
  },
  {
    name: "Mia T.", rating: 5,
    segments: [
      { text: "Fast shipping, beautiful packaging. The product ", h: false },
      { text: "exceeded every expectation", h: true },
      { text: " I had going in.", h: false },
    ],
  },
  {
    name: "Jordan K.", rating: 4,
    segments: [
      { text: "Ordered three times already. ", h: false },
      { text: "Haven't once been disappointed", h: true },
      { text: ". Quality speaks for itself.", h: false },
    ],
  },
  {
    name: "Sam O.", rating: 5,
    segments: [
      { text: "The attention to detail tells you ", h: false },
      { text: "they actually care", h: true },
      { text: " about what they put out.", h: false },
    ],
  },
  {
    name: "Nia B.", rating: 4,
    segments: [
      { text: "My go-to for gifts. It ", h: false },
      { text: "always impresses", h: true },
      { text: " whoever receives it, every time.", h: false },
    ],
  },
];

const OPEN_QUOTE = '“';

export function Testimonials() {
  const [page, setPage] = useState(0);
  const visible = TESTIMONIALS.slice(page * 3, page * 3 + 3);
  const pages = Math.ceil(TESTIMONIALS.length / 3);

  return (
    <section className="w-full px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">What they say</h2>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`rounded-full transition-all duration-200 ${i === page ? 'w-5 h-2 bg-blue-950 dark:bg-blue-200' : 'w-2 h-2 bg-blue-200 dark:bg-blue-800 hover:bg-blue-400'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visible.map((t, i) => (
          <div key={i} className="relative rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-6 pt-16 pb-6 flex flex-col justify-between min-h-44">
            <span
              className="absolute -top-6 -left-1 leading-none select-none text-blue-200 dark:text-blue-800"
              style={{ fontSize: '180px', fontFamily: 'Georgia, serif' }}
            >
              {OPEN_QUOTE}
            </span>
            <p className="relative text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.segments.map((seg, j) =>
                seg.h
                  ? <span key={j} className="text-blue-500 dark:text-blue-400 font-medium">{seg.text}</span>
                  : <span key={j}>{seg.text}</span>
              )}
            </p>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.name}</p>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="10" height="10" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    fill={s <= t.rating ? 'currentColor' : 'none'} stroke="currentColor" className="text-amber-400">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
