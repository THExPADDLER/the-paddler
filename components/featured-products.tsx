"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { products, type Product } from "@/lib/products"
import { useWishlist } from "@/lib/wishlist-context"

const normalizeProduct = (product: Product): Product => {
  const fallbackMrp = product.mrp || 1999
  const totalStock = product.stockBySize
    ? Object.values(product.stockBySize).reduce((sum, value) => sum + Number(value || 0), 0)
    : product.stock

  return {
    ...product,
    images: product.images?.length ? product.images : [product.image],
    mrp: fallbackMrp > product.price ? fallbackMrp : undefined,
    inStock:
      typeof totalStock === "number" ? totalStock > 0 : product.inStock,
    stock: typeof totalStock === "number" ? totalStock : product.stock,
  }
}

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(
    products.slice(0, 4).map(normalizeProduct)
  )
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const featuredSnap = await getDoc(doc(db, "siteContent", "featuredProducts"))
        const selectedSlugs = featuredSnap.exists()
          ? ((featuredSnap.data().slugs || []) as string[])
          : []

        const productsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        )
        const snapshot = await getDocs(productsQuery)

        if (!snapshot.empty) {
          const firestoreProducts = snapshot.docs.map((item) =>
            normalizeProduct(item.data() as Product)
          )
          const selectedProducts = selectedSlugs
            .map((slug) => firestoreProducts.find((product) => product.slug === slug))
            .filter(Boolean) as Product[]

          setFeaturedProducts(
            (selectedProducts.length ? selectedProducts : firestoreProducts).slice(0, 4)
          )
        }
      } catch (error) {
        console.error("FEATURED PRODUCTS FETCH ERROR:", error)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return (
    <section id="shop" className="py-16 sm:py-24 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            FEATURED DROP
          </h2>

          <Link href="/shop" className="text-sm font-medium hover:underline underline-offset-4">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            const saved = isInWishlist(product.id)
            const hoverImage = product.images?.[1] || product.image
            const lowStock =
              product.inStock &&
              typeof product.stock === "number" &&
              product.stock > 0 &&
              product.stock <= 5

            return (
              <div key={product.id} className="group relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    if (saved) {
                      removeFromWishlist(product.id)
                    } else {
                      addToWishlist({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        mrp: product.mrp,
                        image: product.image,
                        slug: product.slug,
                      })
                    }
                  }}
                  className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      saved ? "fill-red-500 text-red-500" : "text-white"
                    }`}
                  />
                </button>

                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-0"
                    />

                    <Image
                      src={hoverImage}
                      alt={`${product.name} hover`}
                      fill
                      className="object-cover scale-105 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                    {product.badge && (
                      <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium ${product.badgeColor}`}>
                        {product.badge}
                      </span>
                    )}

                    {lowStock && (
                      <span className="absolute bottom-3 left-3 bg-background text-red-500 px-3 py-1 text-xs font-black">
                        ONLY FEW DROPS LEFT
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium group-hover:underline underline-offset-4">
                        {product.name}
                      </h3>

                      <p className="text-xs text-neutral-500 mt-0.5">
                        {product.color}
                      </p>
                    </div>

                    <div className="text-right">
                      {product.mrp && product.mrp > product.price && (
                        <p className="relative inline-block text-xs text-neutral-500">
                          <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-black z-10" />
                          MRP ₹{product.mrp}
                        </p>
                      )}

                      <p className="text-base font-black text-background">
                        ₹{product.price}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
