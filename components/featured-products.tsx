"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
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
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
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
    <section
      id="shop"
      className="relative overflow-hidden py-16 sm:py-24 bg-background text-foreground"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setCursor({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        })
      }}
      style={
        {
          "--fx-x": `${cursor.x}%`,
          "--fx-y": `${cursor.y}%`,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="featured-cursor-spotlight pointer-events-none absolute inset-0" />
      <div className="featured-noise pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-0 right-0 top-10 rotate-[-2deg] border-y border-lime-300/25 bg-lime-300/10 py-2 text-xs font-black tracking-[0.45em] text-lime-200 animate-[featured-ticker_18s_linear_infinite] whitespace-nowrap">
        DROP ACTIVE / OVERSIZED FIT / 240 GSM / LIMITED PIECES / THE PADDLER / DROP ACTIVE / OVERSIZED FIT / 240 GSM / LIMITED PIECES / THE PADDLER /
      </div>
      <div className="pointer-events-none absolute left-0 right-0 bottom-16 rotate-[2deg] border-y border-white/10 bg-white/5 py-2 text-xs font-black tracking-[0.45em] text-white/40 animate-[featured-ticker-reverse_22s_linear_infinite] whitespace-nowrap">
        STREET UNIFORM / NO RESTOCK ENERGY / BUILT DIFFERENT / STREET UNIFORM / NO RESTOCK ENERGY / BUILT DIFFERENT /
      </div>
      <div className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full border border-lime-300/30 animate-[featured-orbit_6s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-4 bottom-8 h-60 w-60 rounded-full border border-white/15 animate-[featured-orbit_7s_ease-in-out_infinite_1s]" />
      <div className="pointer-events-none absolute inset-y-[-30%] left-[-40%] w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-lime-300/35 to-transparent animate-[featured-sweep_4.5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-12 top-10 text-[14vw] font-black leading-none text-white/[0.055] animate-[featured-word-drift_7s_ease-in-out_infinite]">
        LIMITED
      </div>
      <div className="pointer-events-none absolute left-6 bottom-[-0.16em] text-[16vw] font-black leading-none text-lime-200/[0.075] animate-[featured-word-drift_8s_ease-in-out_infinite_1s]">
        DROP
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="relative flex items-center justify-between mb-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            FEATURED DROP
          </h2>

          <Link href="/shop" className="group text-sm font-black underline-offset-4">
            View All
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            const saved = isInWishlist(product.id)
            const hoverImage = product.images?.[1] || product.image
            const lowStock =
              product.inStock &&
              typeof product.stock === "number" &&
              product.stock > 0 &&
              product.stock <= 5

            return (
              <div key={product.id} className="product-card-pop product-card-crazy group relative">
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
                  <div className="relative aspect-square bg-neutral-100 overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
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
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black px-4 py-3 text-xs font-black tracking-[0.2em] text-white transition-transform duration-300 group-hover:translate-y-0">
                      VIEW PRODUCT
                    </div>

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
                      <h3 className="text-sm font-black text-white transition-transform duration-300 group-hover:translate-x-1">
                        {product.name}
                      </h3>

                      <p className="text-xs text-white/55 mt-0.5">
                        {product.color}
                      </p>
                    </div>

                    <div className="text-right">
                      {product.mrp && product.mrp > product.price && (
                        <p className="relative inline-block text-xs text-white/45">
                          <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-current z-10" />
                          MRP ₹{product.mrp}
                        </p>
                      )}

                      <p className="text-base font-black text-lime-200">
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
