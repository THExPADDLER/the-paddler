import Image from "next/image"
import Link from "next/link"

const products = [
  {
    id: 1,
    name: "NULL SPACE TEE",
    description: "HEAVYWEIGHT COTTON",
    price: 85,
    image: "/images/tshirt-black.jpg",
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
  },
  {
    id: 2,
    name: "VOID SHELL V1",
    description: "TECHNICAL OUTERWEAR",
    price: 320,
    image: "/images/jacket-olive.jpg",
    badge: null,
    badgeColor: null,
  },
  {
    id: 3,
    name: "GRIT CARGO",
    description: "CANVAS DUCK",
    price: 145,
    image: "/images/cargo-black.jpg",
    badge: "SOLD OUT",
    badgeColor: "bg-red-600 text-white",
  },
]

export function FeaturedProducts() {
  return (
    <section id="shop" className="py-16 sm:py-24 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            FEATURED DROP
          </h2>
          <Link 
            href="#" 
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            View All
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href="#"
              className="group block"
            >
              <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.badge && (
                  <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium ${product.badgeColor}`}>
                    {product.badge}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">{product.name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{product.description}</p>
                </div>
                <span className="text-sm font-medium">${product.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
