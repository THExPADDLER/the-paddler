"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Flame,
  Heart,
  PackageCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { db } from "@/lib/firebase"
import { products as localProducts, type Product } from "@/lib/products"
import { useWishlist } from "@/lib/wishlist-context"

type SortOption = "featured" | "price-low" | "price-high"
type StockOption = "all" | "in-stock" | "sold-out"

type FirestoreProduct = Product & {
  stock?: number
  createdAt?: string
}

const normalizeProduct = (product: FirestoreProduct): Product => {
  const totalStock = product.stockBySize
    ? Object.values(product.stockBySize).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      )
    : product.stock

  return {
    ...product,
    images: product.images?.length ? product.images : [product.image],
    mrp: product.mrp && product.mrp > product.price ? product.mrp : undefined,
    inStock:
      typeof totalStock === "number" ? totalStock > 0 : product.inStock,
    stock: typeof totalStock === "number" ? totalStock : product.stock,
  }
}

const mergeCatalogProducts = (firestoreProducts: FirestoreProduct[]) => {
  const overridesBySlug = new Map(
    firestoreProducts.map((product) => [product.slug, product])
  )

  return localProducts.map((product) => {
    const override = overridesBySlug.get(product.slug)

    return normalizeProduct({
      ...product,
      ...(override || {}),
      id: product.id,
      slug: product.slug,
    })
  })
}

export default function ShopPage() {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(
    localProducts.map(normalizeProduct)
  )
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState("All")
  const [stock, setStock] = useState<StockOption>("all")
  const [sort, setSort] = useState<SortOption>("featured")
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        const productsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        )
        const snapshot = await getDocs(productsQuery)

        setCatalogProducts(
          mergeCatalogProducts(
            snapshot.docs.map((item) => item.data() as FirestoreProduct)
          )
        )
      } catch (error) {
        console.error("SHOP PRODUCTS FETCH ERROR:", error)
        setCatalogProducts(localProducts.map(normalizeProduct))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const colorOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(catalogProducts.map((product) => product.color))),
    ]
  }, [catalogProducts])

  const filteredProducts = useMemo(() => {
    const filtered = catalogProducts.filter((product) => {
      const colorMatch =
        selectedColor === "All" || product.color === selectedColor
      const stockMatch =
        stock === "all" ||
        (stock === "in-stock" && product.inStock) ||
        (stock === "sold-out" && !product.inStock)

      return colorMatch && stockMatch
    })

    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price
      if (sort === "price-high") return b.price - a.price
      return a.id - b.id
    })
  }, [catalogProducts, selectedColor, sort, stock])

  const shopStats = useMemo(() => {
    const inStock = catalogProducts.filter((product) => product.inStock).length
    const soldOut = Math.max(catalogProducts.length - inStock, 0)

    return [
      { label: "Pieces", value: catalogProducts.length.toString() },
      { label: "Live", value: inStock.toString() },
      { label: "Sold Out", value: soldOut.toString() },
    ]
  }, [catalogProducts])

  const previewProducts = useMemo(() => {
    return catalogProducts.slice(0, 3)
  }, [catalogProducts])

  return (
    <>
      <Header />

      <main className="shop-stage min-h-screen overflow-hidden bg-background text-foreground pt-24 pb-20">
        <section className="shop-grid relative border-b border-border">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-20">
            <div className="shop-hero-copy">
              <div className="mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.32em] text-neutral-300">
                <Sparkles className="h-4 w-4 text-accent" />
                The Current Drop
              </div>

              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
                Shop
                <span className="block text-neutral-500">The Drop</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg">
                Premium oversized streetwear in limited runs. Filter the wall,
                lock your size, and move before the drop disappears.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#shop-grid"
                  className="inline-flex items-center justify-center gap-3 bg-white px-8 py-4 text-sm font-black text-black"
                >
                  Start Shopping
                  <ArrowRight className="h-4 w-4" />
                </a>

                <div className="inline-flex items-center justify-center gap-3 border border-white/15 px-8 py-4 text-sm font-black text-white">
                  <Flame className="h-4 w-4 text-accent" />
                  Few Drops Left
                </div>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 border border-white/10">
                {shopStats.map((item) => (
                  <div key={item.label} className="shop-stat px-4 py-5">
                    <p className="text-3xl font-black">{item.value}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="shop-preview-stack relative min-h-[420px] lg:min-h-[520px]">
              <div className="absolute left-4 top-6 border border-white/15 bg-black/70 px-4 py-3 text-xs font-black uppercase tracking-[0.28em] text-white backdrop-blur">
                Drop Wall
              </div>

              {previewProducts.map((product, index) => (
                <Link
                  href={`/product/${product.slug}`}
                  key={product.id}
                  className={`shop-preview-card shop-preview-card-${index + 1} absolute block overflow-hidden border border-white/15 bg-neutral-950 shadow-2xl`}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 70vw, 26vw"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
                      Preview {index + 1}
                    </p>
                    <p className="mt-1 text-lg font-black uppercase leading-tight">
                      {product.name}
                    </p>
                  </div>
                </Link>
              ))}

              <div className="absolute bottom-6 right-0 max-w-xs border border-accent/40 bg-accent px-5 py-4 text-black shadow-[0_24px_80px_rgba(218,239,48,0.18)]">
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-5 w-5" />
                  <p className="text-sm font-black uppercase">
                    Free shipping on every order
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="shop-grid"
          className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="shop-control-panel mb-10 border border-white/10 bg-black/70 p-4 backdrop-blur sm:p-5">
            <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-neutral-500">
                  Filter Console
                </p>
                <h2 className="mt-2 text-xl font-black uppercase">
                  {loading
                    ? "Loading products..."
                    : `${filteredProducts.length} of ${catalogProducts.length} products ready`}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-neutral-400">
                <SlidersHorizontal className="h-4 w-4" />
                Tap filters to move the wall
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`shop-filter-button px-4 py-2 text-sm font-bold transition-colors ${
                      selectedColor === color
                        ? "is-active bg-foreground text-background"
                        : "border border-white/15 hover:border-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <select
                  value={stock}
                  onChange={(event) =>
                    setStock(event.target.value as StockOption)
                  }
                  className="border border-white/15 bg-black px-4 py-3 text-sm font-bold text-white outline-none"
                >
                  <option value="all">All Stock</option>
                  <option value="in-stock">In Stock</option>
                  <option value="sold-out">Sold Out</option>
                </select>

                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  className="border border-white/15 bg-black px-4 py-3 text-sm font-bold text-white outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.03] py-20 text-center">
              <h2 className="mb-3 text-2xl font-black">NO PRODUCTS FOUND</h2>
              <p className="text-muted-foreground">
                Try changing the filters to view more pieces.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const saved = isInWishlist(product.id)
                const hoverImage = product.images?.[1] || product.image
                const lowStock =
                  product.inStock &&
                  typeof product.stock === "number" &&
                  product.stock > 0 &&
                  product.stock <= 5

                return (
                  <div
                    key={product.id}
                    className="shop-product-card product-card-crazy group relative"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (saved) {
                          removeFromWishlist(product.id)
                        } else {
                          addToWishlist({
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            mrp: product.mrp || undefined,
                            image: product.image,
                            slug: product.slug,
                          })
                        }
                      }}
                      className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/85 backdrop-blur transition-transform hover:scale-110"
                      aria-label={
                        saved ? "Remove from wishlist" : "Add to wishlist"
                      }
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          saved ? "fill-red-500 text-red-500" : "text-white"
                        }`}
                      />
                    </button>

                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="shop-product-image relative aspect-square overflow-hidden bg-neutral-900">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-0"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />

                        <Image
                          src={hoverImage}
                          alt={`${product.name} alternate view`}
                          fill
                          className="scale-105 object-cover opacity-0 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-60 transition-opacity duration-500 group-hover:opacity-90" />

                        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-2 bg-white px-4 py-2 text-xs font-black uppercase text-black">
                            View Product
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>

                        {product.badge && (
                          <span
                            className={`absolute left-3 top-3 px-3 py-2 text-xs font-black uppercase ${
                              product.badgeColor || "bg-white text-black"
                            }`}
                          >
                            {product.badge}
                          </span>
                        )}

                        {!product.inStock && (
                          <span className="absolute bottom-3 left-3 bg-white px-3 py-1 text-xs font-black text-black">
                            SOLD OUT
                          </span>
                        )}

                        {lowStock && (
                          <span className="absolute bottom-3 left-3 bg-black px-3 py-1 text-xs font-black text-red-400">
                            ONLY FEW DROPS LEFT
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-base font-black uppercase leading-tight group-hover:text-accent">
                            {product.name}
                          </h2>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {product.color} / {product.description}
                          </p>

                          {lowStock && (
                            <p className="mt-2 text-xs font-black text-red-400">
                              Only few drops left
                            </p>
                          )}
                        </div>

                        <div className="whitespace-nowrap text-right">
                          {product.mrp && product.mrp > product.price && (
                            <p className="relative inline-block text-xs text-muted-foreground">
                              <span className="absolute left-0 right-0 top-1/2 z-10 h-[2px] -translate-y-1/2 bg-white" />
                              MRP ₹{product.mrp}
                            </p>
                          )}

                          <p className="text-base font-black text-accent">
                            ₹{product.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
