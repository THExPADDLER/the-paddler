import { NextResponse } from "next/server"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { createShiprocketReturnForOrder } from "@/lib/shiprocket"

const RTO_CHARGE = 70

export async function POST(request: Request) {
  try {
    const { orderId, userId, customerEmail, reason = "Customer return request" } =
      await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required.",
        },
        { status: 400 }
      )
    }

    const orderRef = doc(serverDb, "orders", orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order not found.",
        },
        { status: 404 }
      )
    }

    const order = orderSnap.data()

    if (order.status !== "delivered") {
      return NextResponse.json(
        {
          ok: false,
          message: "Return can be requested only after delivery.",
        },
        { status: 400 }
      )
    }

    const amount = Number(order?.pricing?.total || 0)
    const refundAmount = Math.max(amount - RTO_CHARGE, 0)
    const shiprocketReturn = await createShiprocketReturnForOrder(orderId)
    const now = new Date().toISOString()

    await addDoc(collection(serverDb, "returns"), {
      orderId,
      userId: userId || order.userId || "",
      customerEmail: customerEmail || order.customer?.email || "",
      items: order.items || [],
      amount,
      rtoCharge: RTO_CHARGE,
      refundAmount,
      reason,
      status: "return_requested",
      pickupStatus: "shiprocket_return_created",
      refundStatus: "refund_after_rto_pickup",
      shiprocketReturn,
      createdAt: now,
      updatedAt: now,
    })

    await updateDoc(orderRef, {
      status: "return_requested",
      returnRequested: true,
      returnRefundAmount: refundAmount,
      rtoCharge: RTO_CHARGE,
      updatedAt: now,
    })

    return NextResponse.json({
      ok: true,
      orderId,
      rtoCharge: RTO_CHARGE,
      refundAmount,
      shiprocketReturn,
      message: `Return requested. Refund amount will be ₹${refundAmount} after deducting ₹${RTO_CHARGE} RTO charges.`,
    })
  } catch (error) {
    console.error("SHIPROCKET RETURN ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create return request.",
      },
      { status: 500 }
    )
  }
}
