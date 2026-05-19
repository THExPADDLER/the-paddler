import { NextResponse } from "next/server"
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"
import { deductSharedInventoryForItems } from "@/lib/inventory"

const getWebhookCredentials = () => ({
  username: process.env.PHONEPE_WEBHOOK_USERNAME || "",
  password: process.env.PHONEPE_WEBHOOK_PASSWORD || "",
})

const parseBasicAuth = (header: string | null) => {
  if (!header?.startsWith("Basic ")) return null

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
    const separatorIndex = decoded.indexOf(":")

    if (separatorIndex === -1) return null

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

const isWebhookAuthorized = (request: Request) => {
  const expected = getWebhookCredentials()

  if (!expected.username || !expected.password) {
    console.warn("PHONEPE WEBHOOK AUTH SKIPPED: credentials not configured.")
    return true
  }

  const received = parseBasicAuth(request.headers.get("authorization"))

  return (
    received?.username === expected.username &&
    received?.password === expected.password
  )
}

const findValueByKeys = (value: unknown, keys: string[]): string | null => {
  if (!value || typeof value !== "object") return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKeys(item, keys)
      if (found) return found
    }

    return null
  }

  const record = value as Record<string, unknown>

  for (const key of keys) {
    const match = record[key]

    if (typeof match === "string" && match.trim()) {
      return match.trim()
    }
  }

  for (const nested of Object.values(record)) {
    const found = findValueByKeys(nested, keys)
    if (found) return found
  }

  return null
}

const getEventName = (body: any) =>
  String(
    body?.event ||
      body?.eventName ||
      body?.type ||
      body?.data?.event ||
      body?.payload?.event ||
      ""
  )

const normalizePaymentStatus = (eventName: string, body: any) => {
  const state = String(
    findValueByKeys(body, ["state", "status", "paymentState", "transactionStatus"]) ||
      eventName
  ).toLowerCase()

  if (
    eventName === "checkout.order.completed" ||
    eventName === "pg.order.completed" ||
    state.includes("completed") ||
    state.includes("success")
  ) {
    return {
      orderStatus: "paid",
      paymentStatus: "success",
      phonepeState: eventName || state,
    }
  }

  if (
    eventName === "checkout.order.failed" ||
    eventName === "pg.order.failed" ||
    state.includes("failed") ||
    state.includes("failure")
  ) {
    return {
      orderStatus: "payment_failed",
      paymentStatus: "failed",
      phonepeState: eventName || state,
    }
  }

  return {
    orderStatus: "payment_update_received",
    paymentStatus: "pending",
    phonepeState: eventName || state || "callback_received",
  }
}

const syncInvoicePayment = async (
  orderId: string,
  paymentStatus: string,
  phonepeState: string
) => {
  const invoicesQuery = query(
    collection(db, "invoices"),
    where("orderId", "==", orderId)
  )
  const invoiceSnap = await getDocs(invoicesQuery)

  await Promise.all(
    invoiceSnap.docs.map((invoiceDoc) =>
      updateDoc(doc(db, "invoices", invoiceDoc.id), {
        paymentStatus,
        phonepeState,
        updatedAt: new Date().toISOString(),
      })
    )
  )
}

const runSuccessSideEffects = async (orderId: string) => {
  let inventoryError = null
  let shipment = null
  let shipmentError = null

  try {
    const orderRef = doc(db, "orders", orderId)
    const orderSnap = await getDoc(orderRef)
    const order = orderSnap.exists() ? orderSnap.data() : null

    if (order && order.inventoryDeducted !== true) {
      await deductSharedInventoryForItems(order.items || [])
      await updateDoc(orderRef, {
        inventoryDeducted: true,
        inventoryDeductedAt: new Date().toISOString(),
        inventoryError: null,
      })
    }
  } catch (error) {
    inventoryError =
      error instanceof Error
        ? error.message
        : "Unable to deduct shared inventory."
    console.error("PHONEPE CALLBACK INVENTORY ERROR:", { orderId, error })
    await updateDoc(doc(db, "orders", orderId), {
      inventoryError,
      updatedAt: new Date().toISOString(),
    })
  }

  try {
    shipment = await createShiprocketShipmentForOrder(orderId)
  } catch (error) {
    shipmentError =
      error instanceof Error
        ? error.message
        : "Unable to create Shiprocket shipment."
    console.error("PHONEPE CALLBACK SHIPROCKET ERROR:", { orderId, error })

    await updateDoc(doc(db, "orders", orderId), {
      shipmentError,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    inventoryError,
    shipment,
    shipmentError,
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/phonepe/callback",
    message: "PhonePe callback endpoint is available.",
  })
}

export async function POST(request: Request) {
  try {
    if (!isWebhookAuthorized(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized webhook.",
        },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)

    console.log("PHONEPE CALLBACK:", body)

    const merchantOrderId =
      findValueByKeys(body, [
        "merchantOrderId",
        "merchantTransactionId",
        "merchant_order_id",
      ]) || ""
    const eventName = getEventName(body)
    const { orderStatus, paymentStatus, phonepeState } = normalizePaymentStatus(
      eventName,
      body
    )
    const transactionReference = findValueByKeys(body, [
      "transactionId",
      "transactionReference",
      "providerReferenceId",
      "paymentId",
    ])

    if (merchantOrderId) {
      await updateDoc(doc(db, "orders", merchantOrderId), {
        status: orderStatus,
        "payment.status": paymentStatus,
        "payment.phonepeState": phonepeState,
        "payment.transactionReference": transactionReference || null,
        phonepeCallback: body,
        phonepeCallbackEvent: eventName,
        updatedAt: new Date().toISOString(),
      })

      await syncInvoicePayment(merchantOrderId, paymentStatus, phonepeState)

      const sideEffects =
        paymentStatus === "success"
          ? await runSuccessSideEffects(merchantOrderId)
          : {
              inventoryError: null,
              shipment: null,
              shipmentError: null,
            }

      return NextResponse.json({
        ok: true,
        message: "PhonePe callback processed.",
        orderId: merchantOrderId,
        paymentStatus,
        phonepeState,
        ...sideEffects,
      })
    }

    return NextResponse.json({
      ok: true,
      message: "PhonePe callback received, but merchant order id was missing.",
    })
  } catch (error) {
    console.error("PHONEPE CALLBACK ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to process PhonePe callback.",
      },
      { status: 500 }
    )
  }
}
