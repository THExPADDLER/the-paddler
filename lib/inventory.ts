import { doc, getDoc, runTransaction, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

export type SizeStock = Record<string, number>
type InventoryCartItem = {
  description: string
  quantity: number
  size: string
  color?: string
}

export const inventoryColors = [
  { key: "black", label: "Black" },
  { key: "white", label: "White" },
  { key: "emerald-green", label: "Emerald Green" },
  { key: "beige", label: "Beige" },
]

export const createInventoryKey = (color: string) => {
  return color
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const emptySizeStock = {
  S: 0,
  M: 0,
  L: 0,
}

export const getSharedInventory = async (color: string) => {
  const key = createInventoryKey(color)
  const snapshot = await getDoc(doc(db, "inventory", key))

  if (!snapshot.exists()) return null

  return snapshot.data().stockBySize as SizeStock | undefined
}

export const saveSharedInventory = async (color: string, stockBySize: SizeStock) => {
  const key = createInventoryKey(color)

  await setDoc(
    doc(db, "inventory", key),
    {
      color,
      stockBySize,
      stock: Object.values(stockBySize).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      ),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
}

export const deductSharedInventoryForItems = async (
  items: InventoryCartItem[]
) => {
  const grouped = items.reduce<Record<string, { color: string; sizes: SizeStock }>>(
    (acc, item) => {
      const color = item.color || item.description.split("/")[0]?.trim()
      const key = createInventoryKey(color)

      if (!key || !item.size) return acc

      if (!acc[key]) {
        acc[key] = {
          color,
          sizes: {},
        }
      }

      acc[key].sizes[item.size] =
        Number(acc[key].sizes[item.size] || 0) + Number(item.quantity || 0)

      return acc
    },
    {}
  )

  await Promise.all(
    Object.entries(grouped).map(([key, group]) =>
      runTransaction(db, async (transaction) => {
        const inventoryRef = doc(db, "inventory", key)
        const snapshot = await transaction.get(inventoryRef)
        const currentStock = snapshot.exists()
          ? ((snapshot.data().stockBySize || {}) as SizeStock)
          : emptySizeStock

        const nextStock: SizeStock = {
          ...emptySizeStock,
          ...currentStock,
        }

        Object.entries(group.sizes).forEach(([size, quantity]) => {
          if (Number(nextStock[size] || 0) < quantity) {
            throw new Error(
              `Insufficient ${group.color} stock in size ${size}.`
            )
          }

          nextStock[size] = Math.max(0, Number(nextStock[size] || 0) - quantity)
        })

        transaction.set(
          inventoryRef,
          {
            color: group.color,
            stockBySize: nextStock,
            stock: Object.values(nextStock).reduce(
              (sum, value) => sum + Number(value || 0),
              0
            ),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      })
    )
  )
}
