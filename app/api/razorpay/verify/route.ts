import { after, NextResponse } from "next/server"
import crypto from "crypto"

import { assertOrderAccess, requireUserRequest } from "@/lib/admin-auth"
import { serverDb } from "@/lib/firebase-server"
import {
  createInventoryKey,
  emptySizeStock,
  type SizeStock,
} from "@/lib/inventory"
import { getRazorpayKeySecret, razorpayFetch } from "@/lib/razorpay"
import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"

export const runtime = "nodejs"

type RazorpayPayment = {
  id: string
  order_id?: string
  amount?: number
  currency?: string
  status?: string
  captured?: boolean
}

type OrderItemForInventory = {
  description?: string
  quantity?: number
  size?: string
  color?: string
}

const verifySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
) => {
  const expected = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")

  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  )
}

const deductSharedInventoryForItemsServer = async (
  items: OrderItemForInventory[]
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

const syncInvoicePayment = async (orderId: string) => {
  const invoiceSnap = await serverDb
    .collection("invoices")
    .where("orderId", "==", orderId)
    .get()

  await Promise.all(
    invoiceSnap.docs.map((invoiceDoc) =>
      invoiceDoc.ref.update({
        paymentStatus: "success",
        razorpayState: "signature_verified",
        updatedAt: new Date().toISOString(),
      })
    )
  )
}

const runSuccessSideEffects = async (orderId: string) => {
  let inventoryError: string | null = null
  let shipmentError: string | null = null
  const orderRef = serverDb.collection("orders").doc(orderId)

  try {
    const orderSnap = await orderRef.get()
    const order = orderSnap.exists ? orderSnap.data() : null

    if (order && order.inventoryDeducted !== true) {
      await deductSharedInventoryForItemsServer(
        (order.items || []) as OrderItemForInventory[]
      )
      await orderRef.update({
        inventoryDeducted: true,
        inventoryDeductedAt: new Date().toISOString(),
        inventoryError: null,
      })
    }
  } catch (error) {
    console.error("RAZORPAY INVENTORY ERROR:", { orderId, error })
    inventoryError =
      error instanceof Error
        ? error.message
        : "Unable to deduct shared inventory."
    await orderRef.update({
      inventoryError,
      updatedAt: new Date().toISOString(),
    })
  }

  try {
    await createShiprocketShipmentForOrder(orderId)
  } catch (error) {
    console.error("RAZORPAY SHIPROCKET ERROR:", { orderId, error })
    shipmentError =
      error instanceof Error
        ? error.message
        : "Unable to create Shiprocket shipment."
    await orderRef.update({
      shipmentError,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    inventoryError,
    shipmentError,
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserRequest(request)
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json()

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing Razorpay verification fields.",
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
    assertOrderAccess(auth, order, "verify payment for this order")

    const payment = (order.payment || {}) as Record<string, unknown>
    const expectedRazorpayOrderId = String(payment.razorpayOrderId || "")

    if (!expectedRazorpayOrderId || expectedRazorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Razorpay order does not match this website order.",
        },
        { status: 400 }
      )
    }

    if (payment.status === "success") {
      const existingPaymentId = String(payment.razorpayPaymentId || "")

      if (existingPaymentId === razorpay_payment_id) {
        return NextResponse.json({
          ok: true,
          orderId,
          paymentStatus: "success",
          shipmentQueued: false,
        })
      }

      return NextResponse.json(
        {
          ok: false,
          message: "Payment is already verified for this order.",
        },
        { status: 400 }
      )
    }

    if (
      !verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Razorpay signature verification failed.",
        },
        { status: 400 }
      )
    }

    const razorpayPayment = await razorpayFetch<RazorpayPayment>(
      `/payments/${razorpay_payment_id}`,
      {
        method: "GET",
      }
    )
    const savedTotalPaise = Math.round(Number(order.pricing?.total || 0) * 100)
    const paymentStatus = String(razorpayPayment.status || "").toLowerCase()

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Razorpay payment does not belong to this Razorpay order.",
        },
        { status: 400 }
      )
    }

    if (Number(razorpayPayment.amount || 0) !== savedTotalPaise) {
      return NextResponse.json(
        {
          ok: false,
          message: "Paid amount does not match the order total.",
        },
        { status: 400 }
      )
    }

    if (
      String(razorpayPayment.currency || "").toUpperCase() !== "INR" ||
      (paymentStatus !== "captured" && razorpayPayment.captured !== true)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Razorpay payment is not captured yet.",
        },
        { status: 400 }
      )
    }

    await orderRef.update({
      status: "paid",
      "payment.gateway": "razorpay",
      "payment.status": "success",
      "payment.razorpayOrderId": razorpay_order_id,
      "payment.razorpayPaymentId": razorpay_payment_id,
      "payment.razorpaySignature": razorpay_signature,
      "payment.razorpayPayment": razorpayPayment,
      "payment.verifiedAt": new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    after(async () => {
      try {
        await syncInvoicePayment(orderId)
        await runSuccessSideEffects(orderId)
      } catch (error) {
        console.error("RAZORPAY BACKGROUND SIDE EFFECT ERROR:", {
          orderId,
          error,
        })
      }
    })

    return NextResponse.json({
      ok: true,
      orderId,
      paymentStatus: "success",
      shipmentQueued: true,
    })
  } catch (error) {
    console.error("RAZORPAY VERIFY ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to verify Razorpay payment.",
      },
      { status: 500 }
    )
  }
}
