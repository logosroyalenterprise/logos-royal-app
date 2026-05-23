import Image from "next/image";

const DESKTOP_CARDS = [
  // Left flank
  { label: "Sneakers",    img: "/images/sneakers_card.avif", style: { top: "84px",  left: "3%",  rotate: -5, width: 112 } },
  { label: "Beauty",      img: "/images/beauty_card.webp",  style: { top: "210px", left: "7%",  rotate:  3, width: 106 } },

  // Center-right
  { label: "Fashion",     img: "/images/fashion_card.jpeg", style: { top: "78px",  left: "56%", rotate: -4, width: 108 } },

  // Right flank
  { label: "Electronics", img: "/images/tech_card.jpeg",    style: { top: "90px",  right: "4%", rotate:  4, width: 114 } },
  { label: "Bags",        img: "/images/bags_card.jpeg",    style: { top: "205px", right: "7%", rotate: -4, width: 108 } },
];

// One card floating in the header clearance gap above the hero text
const MOBILE_CARDS = [
  { label: "Sneakers", img: "/images/sneakers_card.avif", delay: 0, style: { top: "68px", right: "12%", rotate: 5, width: 82 } },
  { label: "Beauty",   img: "/images/beauty_card.webp",  delay: 0.7, filterClass: "[filter:brightness(0.85)] dark:[filter:brightness(0.55)]", style: { top: "108px", left: "-6px", rotate: -10, width: 62 } },
];

function Card({ label, img, width, rotate, delay, pos, filterClass }: {
  label: string; img: string; width: number; rotate: number; delay: number;
  pos: React.CSSProperties; filterClass?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width,
        "--rot": `${rotate}deg`,
        animationDelay: `${delay}s`,
        ...pos,
      } as React.CSSProperties}
      className={`float-card rounded-xl sm:rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 [box-shadow:0_0_20px_rgba(147,197,253,0.2)]${filterClass ? ` ${filterClass}` : ""}`}
    >
      <div className="relative w-full" style={{ height: Math.round(width * 0.72) }}>
        <Image src={img} alt={label} fill className="object-cover" sizes="120px" />
      </div>
      <div className="bg-white dark:bg-gray-900 px-2 py-1 sm:px-2.5 sm:py-1.5">
        <p className="text-[10px] sm:text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{label}</p>
      </div>
    </div>
  );
}

export function FloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-5" aria-hidden="true">
      {/* Mobile cards — float around the header gap above hero text */}
      <div className="lg:hidden">
        {MOBILE_CARDS.map(({ label, img, delay, filterClass, style: { rotate, width, ...pos } }) => (
          <Card key={label} label={label} img={img} width={width} rotate={rotate} delay={delay} pos={pos} filterClass={filterClass} />
        ))}
      </div>

      {/* Desktop cards — flanking the hero */}
      <div className="hidden lg:block">
        {DESKTOP_CARDS.map(({ label, img, style: { rotate, width, ...pos } }, i) => (
          <Card key={label} label={label} img={img} width={width} rotate={rotate} delay={i * 0.6} pos={pos} />
        ))}
      </div>
    </div>
  );
}
