import { NextResponse } from "next/server"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"

type ResetTarget = "users" | "orders_revenue" | "coupon_used" | "all"

const isResetTarget = (value: unknown): value is ResetTarget =>
  value === "users" ||
  value === "orders_revenue" ||
  value === "coupon_used" ||
  value === "all"

const deleteCollection = async (name: string) => {
  const snapshot = await getDocs(collection(serverDb, name))

  await Promise.all(
    snapshot.docs.map((item) => deleteDoc(doc(serverDb, name, item.id)))
  )

  return snapshot.size
}

const resetCouponUsage = async () => {
  const ordersSnapshot = await getDocs(collection(serverDb, "orders"))
  const couponsSnapshot = await getDocs(collection(serverDb, "coupons"))
  const now = new Date().toISOString()
  let changedOrders = 0

  await Promise.all(
    ordersSnapshot.docs.map(async (item) => {
      const pricing = item.data().pricing as { couponCode?: string | null } | undefined

      if (!pricing?.couponCode) return

      changedOrders += 1
      await updateDoc(doc(serverDb, "orders", item.id), {
        "pricing.couponCode": null,
        "pricing.couponUsageResetAt": now,
        updatedAt: now,
      })
    })
  )

  await Promise.all(
    couponsSnapshot.docs.map((item) =>
      updateDoc(doc(serverDb, "coupons", item.id), {
        lastUsageResetAt: now,
      })
    )
  )

  return {
    changedOrders,
    couponsTouched: couponsSnapshot.size,
  }
}

export async function POST(request: Request) {
  try {
    const { target, backupConfirmed } = await request.json()

    if (!isResetTarget(target)) {
      return NextResponse.json(
        { ok: false, message: "Valid reset target is required." },
        { status: 400 }
      )
    }

    if (backupConfirmed !== true) {
      return NextResponse.json(
        { ok: false, message: "Backup download must be confirmed before reset." },
        { status: 400 }
      )
    }

    const result: Record<string, unknown> = {}

    if (target === "users" || target === "all") {
      result.usersDeleted = await deleteCollection("users")
    }

    if (target === "orders_revenue" || target === "all") {
      result.ordersDeleted = await deleteCollection("orders")
      result.invoicesDeleted = await deleteCollection("invoices")
      result.returnsDeleted = await deleteCollection("returns")
    }

    if (target === "coupon_used" || target === "all") {
      result.couponUsage = await resetCouponUsage()
    }

    return NextResponse.json({
      ok: true,
      target,
      result,
      message: "Reset completed successfully.",
    })
  } catch (error) {
    console.error("ADMIN RESET ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to reset data.",
      },
      { status: 500 }
    )
  }
}

