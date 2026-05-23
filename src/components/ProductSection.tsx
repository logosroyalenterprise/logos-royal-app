const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 299,
    category: "Tech",
    image: "bg-gradient-to-br from-blue-200 to-blue-100 dark:from-blue-900 dark:to-blue-800",
  },
  {
    id: 2,
    name: "Organic Coffee Beans",
    price: 24,
    category: "Food",
    image: "bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-900 dark:to-amber-800",
  },
  {
    id: 3,
    name: "Leather Crossbody Bag",
    price: 149,
    category: "Bags",
    image: "bg-gradient-to-br from-orange-200 to-orange-100 dark:from-orange-900 dark:to-orange-800",
  },
  {
    id: 4,
    name: "Minimalist Desk Lamp",
    price: 89,
    category: "Home",
    image: "bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-800",
  },
  {
    id: 5,
    name: "Cashmere Sweater",
    price: 189,
    category: "Fashion",
    image: "bg-gradient-to-br from-purple-200 to-purple-100 dark:from-purple-900 dark:to-purple-800",
  },
  {
    id: 6,
    name: "Skincare Serum Set",
    price: 79,
    category: "Beauty",
    image: "bg-gradient-to-br from-pink-200 to-pink-100 dark:from-pink-900 dark:to-pink-800",
  },
];

interface ProductSectionProps {
  title: string;
  id: string;
}

export function ProductSection({ title, id }: ProductSectionProps) {
  return (
    <section className="w-full px-6 sm:px-8 lg:px-12 py-12 sm:py-16 border-t border-gray-100 dark:border-gray-900">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-8 tracking-tight">
        {title}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {mockProducts.map((product) => (
          <button
            key={product.id}
            className="text-left hover:opacity-75 transition-opacity"
          >
            <div
              className={`${product.image} rounded-2xl w-full aspect-square mb-3 flex items-center justify-center`}
            >
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-sm sm:text-base font-medium line-clamp-2 mb-2">
              {product.name}
            </h3>
            <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
              ${product.price}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
