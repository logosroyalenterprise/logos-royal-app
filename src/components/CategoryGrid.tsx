import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    id: "tech",
    name: "Tech & Gadgets",
    description: "Electronics",
    span: "col-span-2 row-span-1",
    img: "/images/tech-and-gadgets.jpeg",
    textColor: "text-white",
    subColor: "text-blue-300",
    size: "wide",
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing & Accessories",
    span: "col-span-1 row-span-2",
    img: "/images/fashion.jpeg",
    textColor: "text-white",
    subColor: "text-purple-300",
    size: "tall",
  },
  {
    id: "food",
    name: "Food & Beverages",
    description: "Fresh & Groceries",
    span: "col-span-1 row-span-1",
    img: "/images/food.avif",
    textColor: "text-white",
    subColor: "text-orange-300",
    size: "small",
  },
  {
    id: "bags",
    name: "Bags & Luggage",
    description: "Travel & Daily",
    span: "col-span-1 row-span-1",
    img: "/images/bags.jpeg",
    textColor: "text-white",
    subColor: "text-amber-300",
    size: "small",
  },
  {
    id: "beauty",
    name: "Beauty & Health",
    description: "Wellness & Personal Care",
    span: "col-span-2 row-span-1",
    img: "/images/beauty.avif",
    textColor: "text-white",
    subColor: "text-pink-300",
    size: "wide",
  },
  {
    id: "home",
    name: "Home & Living",
    description: "Furniture & Decor",
    span: "col-span-2 sm:col-span-1 row-span-1",
    img: "/images/home-and-living.avif",
    textColor: "text-white",
    subColor: "text-teal-300",
    size: "small",
  },
];

export function CategoryGrid() {
  return (
    <section className="w-full px-6 sm:px-8 lg:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-8 tracking-tight">
        Start Here
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 [grid-auto-rows:150px] sm:[grid-auto-rows:220px]">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.id}`}
            className={`${cat.span} rounded-2xl text-left hover:opacity-90 transition-opacity flex flex-col justify-between overflow-hidden relative group`}
          >
            {cat.img && (
              <Image
                src={cat.img}
                alt={cat.name}
                fill
                className="object-cover scale-100 group-hover:scale-110 transition-transform duration-500 ease-out"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            )}
            {cat.img && <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />}

            <div className="relative z-10 p-3 sm:p-5 flex flex-col justify-end h-full">
              <p className={`hidden sm:block text-xs font-medium uppercase tracking-widest mb-1 ${cat.subColor}`}>
                {cat.description}
              </p>
              <h3 className={`font-semibold tracking-tight ${cat.textColor} ${cat.size === "wide" ? "text-lg sm:text-3xl" : cat.size === "tall" ? "text-base sm:text-2xl" : "text-sm sm:text-lg"}`}>
                {cat.name}
              </h3>
              <p className={`hidden sm:flex text-sm font-medium mt-2 items-center gap-1 ${cat.subColor} transition-transform`}>
                Shop now <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
