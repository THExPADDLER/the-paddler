"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from "firebase/firestore"
import { Save, Star } from "lucide-react"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"
import { products as localProducts, type Product } from "@/lib/products"

const normalizeProduct = (product: Product): Product => ({
  ...product,
  images: product.images?.length ? product.images : [product.image],
  stock: product.stockBySize
    ? Object.values(product.stockBySize).reduce((sum, value) => sum + Number(value || 0), 0)
    : product.stock,
  inStock: product.stockBySize
    ? Object.values(product.stockBySize).some((value) => Number(value || 0) > 0)
    : typeof product.stock === "number" ? product.stock > 0 : product.inStock,
})

export default function AdminFeaturedProductsPage() {
  const [products, setProducts] = useState<Product[]>(
    localProducts.map(normalizeProduct)
  )
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [productsSnap, featuredSnap] = await Promise.all([
          getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"))),
          getDoc(doc(db, "siteContent", "featuredProducts")),
        ])

        if (!productsSnap.empty) {
          setProducts(
            productsSnap.docs.map((item) =>
              normalizeProduct(item.data() as Product)
            )
          )
        }

        if (featuredSnap.exists()) {
          setSelectedSlugs((featuredSnap.data().slugs || []) as string[])
        }
      } catch (error) {
        console.error("FEATURED PRODUCTS ADMIN FETCH ERROR:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedProducts = useMemo(() => {
    return selectedSlugs
      .map((slug) => products.find((product) => product.slug === slug))
      .filter(Boolean) as Product[]
  }, [products, selectedSlugs])

  const toggleProduct = (slug: string) => {
    setSelectedSlugs((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug)
      }

      if (current.length >= 4) {
        alert("You can feature up to 4 products on the landing page.")
        return current
      }

      return [...current, slug]
    })
  }

  const saveFeaturedProducts = async () => {
    setSaving(true)

    try {
      await setDoc(
        doc(db, "siteContent", "featuredProducts"),
        {
          slugs: selectedSlugs,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      alert("Featured products saved.")
    } catch (error) {
      console.error("FEATURED PRODUCTS SAVE ERROR:", error)
      alert("Unable to save featured products.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              HOMEPAGE CONTROL
            </p>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-10">
              <div>
                <h1 className="text-4xl font-black">FEATURED PRODUCTS</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select up to 4 products for the landing page Featured Drop section.
                </p>
              </div>

              <button
                type="button"
                onClick={saveFeaturedProducts}
                disabled={saving || loading}
                className="bg-foreground text-background px-6 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "SAVING..." : "SAVE FEATURED"}
              </button>
            </div>

            <section className="border border-border bg-secondary/20 p-5 mb-8">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                CURRENT SELECTION
              </h2>

              {selectedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom featured products selected. Homepage will show the latest products.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedProducts.map((product, index) => (
                    <div key={product.slug} className="border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        #{index + 1}
                      </p>
                      <p className="font-black">{product.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.color} / Rs {product.price}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product) => {
                const selected = selectedSlugs.includes(product.slug)

                return (
                  <button
                    key={product.slug}
                    type="button"
                    onClick={() => toggleProduct(product.slug)}
                    className={`text-left border p-4 transition-colors ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-secondary/20 hover:bg-secondary"
                    }`}
                  >
                    <div className="relative aspect-square bg-neutral-900 mb-4 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />

                      {selected && (
                        <span className="absolute left-3 top-3 bg-accent text-background px-2 py-1 text-xs font-black">
                          FEATURED
                        </span>
                      )}
                    </div>

                    <h2 className="font-black">{product.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.color} / Rs {product.price}
                    </p>
                  </button>
                )
              })}
            </section>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
