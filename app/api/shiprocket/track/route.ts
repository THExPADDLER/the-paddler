import { NextResponse } from "next/server"

import { serverDb } from "@/lib/firebase-server"
import { trackShiprocketAwb } from "@/lib/shiprocket"
import {
  assertOrderAccess,
  requireStaffRequest,
  requireUserRequest,
} from "@/lib/admin-auth"

export const runtime = "nodejs"

const findStringByKeys = (value: unknown, keys: string[]): string | null => {
  if (!value || typeof value !== "object") return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringByKeys(item, keys)
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
    const found = findStringByKeys(nested, keys)
    if (found) return found
  }

  return null
}

const normalizeShiprocketStatus = (tracking: Record<string, unknown>) => {
  const rawStatus =
    findStringByKeys(tracking, [
      "current_status",
      "shipment_status",
      "status",
      "activity",
      "track_status",
      "sr-status-label",
    ]) || "tracking_updated"
  const status = rawStatus.toLowerCase()

  if (status.includes("delivered")) return "delivered"
  if (
    status.includes("out for delivery") ||
    status.includes("ofd") ||
    status.includes("transit") ||
    status.includes("in scan") ||
    status.includes("reached") ||
    status.includes("dispatched")
  ) {
    return "in_transit"
  }
  if (
    status.includes("shipped") ||
    status.includes("picked") ||
    status.includes("manifest") ||
    status.includes("awb")
  ) {
    return "shipped"
  }

  return "processing"
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get("orderId")
    const awbParam = url.searchParams.get("awb")

    let awb = awbParam || ""
    let orderRef = null
    let order: Record<string, unknown> | null = null

    if (orderId) {
      const auth = await requireUserRequest(request)
      orderRef = serverDb.collection("orders").doc(orderId)
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

      order = orderSnap.data() || {}
      assertOrderAccess(auth, order, "track this order")
      const shipment = order.shipment as Record<string, unknown> | undefined
      awb = awb || String(shipment?.awb || order.trackingId || "")
    } else if (awb) {
      await requireStaffRequest(request)
    }

    if (!awb) {
      return NextResponse.json(
        {
          ok: false,
          message: "AWB or orderId with tracking data is required.",
        },
        { status: 400 }
      )
    }

    const tracking = await trackShiprocketAwb(awb)
    const normalizedStatus = normalizeShiprocketStatus(tracking)

    if (orderRef && order) {
      await orderRef.update({
        status: normalizedStatus,
        "shipment.status": normalizedStatus,
        "shipment.lastTrackingResponse": tracking,
        "shipment.lastTrackedAt": new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      ok: true,
      orderId,
      awb,
      status: normalizedStatus,
      tracking,
    })
  } catch (error) {
    console.error("SHIPROCKET TRACK ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch Shiprocket tracking.",
      },
      { status: 500 }
    )
  }
}
