import { NextResponse } from "next/server"

import { requireStaffRequest } from "@/lib/admin-auth"
import { serverDb } from "@/lib/firebase-server"
import {
  createInventoryKey,
  emptySizeStock,
  type SizeStock,
} from "@/lib/inventory"

export const runtime = "nodejs"

type InventoryCartItem = {
  description?: string
  quantity?: number
  size?: string
  color?: string
}

const deductSharedInventoryForItemsServer = async (
  items: InventoryCartItem[]
) => {
  const grouped = items.reduce<Record<string, { color: string; sizes: SizeStock }>>(
    (acc, item) => {
      const color = item.color || item.description?.split("/")[0]?.trim() || ""
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
      serverDb.runTransaction(async (transaction) => {
        const inventoryRef = serverDb.collection("inventory").doc(key)
        const snapshot = await transaction.get(inventoryRef)
        const currentStock = snapshot.exists
          ? ((snapshot.data()?.stockBySize || {}) as SizeStock)
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

export async function POST(request: Request) {
  try {
    await requireStaffRequest(request)

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required.",
        },
        { status: 400 }
      )
    }

    const orderRef = serverDb.collection("orders").doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order not found.",
        },
        { status: 404 }
      )
    }

    const order = orderSnap.data() || {}

    if (order.payment?.status !== "success") {
      return NextResponse.json(
        {
          ok: false,
          message: "Inventory can be deducted only after successful payment.",
        },
        { status: 400 }
      )
    }

    if (order.inventoryDeducted === true) {
      return NextResponse.json({
        ok: true,
        message: "Inventory was already deducted for this order.",
      })
    }

    await deductSharedInventoryForItemsServer(
      (order.items || []) as InventoryCartItem[]
    )

    await orderRef.update({
      inventoryDeducted: true,
      inventoryDeductedAt: new Date().toISOString(),
      inventoryError: null,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      message: "Inventory deducted successfully.",
    })
  } catch (error) {
    console.error("INVENTORY DEDUCT API ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to deduct inventory.",
      },
      { status: 500 }
    )
  }
}
