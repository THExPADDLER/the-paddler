"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { AlertTriangle, Boxes, PackageCheck, PackageX, Save } from "lucide-react"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"
import { emptySizeStock, inventoryColors, saveSharedInventory, type SizeStock } from "@/lib/inventory"

const sizes = ["S", "M", "L"] as const

const getTotalStock = (stock: SizeStock) => {
  return Object.values(stock).reduce((sum, value) => sum + Number(value || 0), 0)
}

const getStockStatus = (value: number) => {
  if (value <= 0) return "OUT"
  if (value <= 5) return "LOW"
  return "OK"
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<Record<string, SizeStock>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const entries = await Promise.all(
          inventoryColors.map(async (color) => {
            const snapshot = await getDoc(doc(db, "inventory", color.key))
            const stockBySize = snapshot.exists()
              ? ({ ...emptySizeStock, ...snapshot.data().stockBySize } as SizeStock)
              : { ...emptySizeStock }

            return [color.key, stockBySize] as const
          })
        )

        setInventory(Object.fromEntries(entries))
      } catch (error) {
        console.error("INVENTORY FETCH ERROR:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [])

  const updateStock = (colorKey: string, size: string, value: string) => {
    setInventory((current) => ({
      ...current,
      [colorKey]: {
        ...emptySizeStock,
        ...current[colorKey],
        [size]: Number(value || 0),
      },
    }))
  }

  const saveInventory = async () => {
    setSaving(true)

    try {
      await Promise.all(
        inventoryColors.map((color) =>
          saveSharedInventory(color.label, {
            ...emptySizeStock,
            ...inventory[color.key],
          })
        )
      )

      alert("Shared inventory saved.")
    } catch (error) {
      console.error("INVENTORY SAVE ERROR:", error)
      alert("Unable to save inventory.")
    } finally {
      setSaving(false)
    }
  }

  const totalUnits = inventoryColors.reduce(
    (sum, color) => sum + getTotalStock(inventory[color.key] || emptySizeStock),
    0
  )
  const outOfStockCells = inventoryColors.reduce((sum, color) => {
    const stock = inventory[color.key] || emptySizeStock
    return sum + sizes.filter((size) => Number(stock[size] || 0) <= 0).length
  }, 0)
  const lowStockCells = inventoryColors.reduce((sum, color) => {
    const stock = inventory[color.key] || emptySizeStock
    return sum + sizes.filter((size) => {
      const value = Number(stock[size] || 0)
      return value > 0 && value <= 5
    }).length
  }, 0)

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              STOCK CONTROL
            </p>

            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-black">SHARED INVENTORY</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set blank tee stock by color and size. Every design using that color shares this stock.
                </p>
              </div>

              <button
                type="button"
                onClick={saveInventory}
                disabled={saving || loading}
                className="bg-foreground text-background px-6 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "SAVING..." : "SAVE INVENTORY"}
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 mb-8">
              <div className="border border-border bg-secondary/20 p-5">
                <Boxes className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Total Blank Tees</p>
                <h2 className="text-3xl font-black mt-2">{totalUnits}</h2>
              </div>

              <div className="border border-border bg-secondary/20 p-5">
                <AlertTriangle className="w-6 h-6 text-yellow-400 mb-4" />
                <p className="text-sm text-muted-foreground">Low Stock Slots</p>
                <h2 className="text-3xl font-black mt-2">{lowStockCells}</h2>
              </div>

              <div className="border border-border bg-secondary/20 p-5">
                <PackageX className="w-6 h-6 text-red-400 mb-4" />
                <p className="text-sm text-muted-foreground">Out Of Stock Slots</p>
                <h2 className="text-3xl font-black mt-2">{outOfStockCells}</h2>
              </div>
            </div>

            <section className="border border-border bg-secondary/20 overflow-x-auto mb-8">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[180px_repeat(3,1fr)_120px] gap-4 border-b border-border px-5 py-4 text-xs font-black text-muted-foreground">
                  <span>COLOR</span>
                  {sizes.map((size) => (
                    <span key={size}>SIZE {size}</span>
                  ))}
                  <span>TOTAL</span>
                </div>

                {inventoryColors.map((color) => {
                  const stock = inventory[color.key] || emptySizeStock
                  const total = getTotalStock(stock)

                  return (
                    <div
                      key={color.key}
                      className="grid grid-cols-[180px_repeat(3,1fr)_120px] gap-4 border-b border-border px-5 py-4 last:border-b-0"
                    >
                      <div>
                        <p className="font-black">{color.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Shared by all {color.label.toLowerCase()} designs
                        </p>
                      </div>

                      {sizes.map((size) => {
                        const value = Number(stock[size] || 0)
                        const status = getStockStatus(value)

                        return (
                          <div key={size}>
                            <p
                              className={`text-xl font-black ${
                                status === "OUT"
                                  ? "text-red-400"
                                  : status === "LOW"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {value}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {status}
                            </p>
                          </div>
                        )
                      })}

                      <div>
                        <p className="text-xl font-black text-accent">{total}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          UNITS
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <div className="space-y-5">
              {inventoryColors.map((color) => {
                const stock = inventory[color.key] || emptySizeStock
                const total = getTotalStock(stock)

                return (
                  <section
                    key={color.key}
                    className="border border-border bg-secondary/20 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black">{color.label}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Update shared stock for every {color.label.toLowerCase()} design.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-black text-accent">
                        <PackageCheck className="w-4 h-4" />
                        TOTAL {total}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {sizes.map((size) => (
                        <label key={size} className="block">
                          <span className="mb-2 block text-sm font-black">
                            {size}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={stock[size] || 0}
                            onChange={(event) =>
                              updateStock(color.key, size, event.target.value)
                            }
                            className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
