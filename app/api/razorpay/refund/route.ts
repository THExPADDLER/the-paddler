import { NextResponse } from "next/server"

import { serverDb } from "@/lib/firebase-server"
import { razorpayFetch } from "@/lib/razorpay"
import { assertOrderAccess, requireUserRequest } from "@/lib/admin-auth"

export const runtime = "nodejs"

type RefundResponse = {
  id: string
  status: string
  amount: number
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserRequest(request)
    const { orderId, reason, cancelledBy } = await request.json()

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
    assertOrderAccess(auth, order, "cancel this order")

    if (cancelledBy === "admin" && auth.role !== "admin" && auth.role !== "staff") {
      return NextResponse.json(
        {
          ok: false,
          message: "Admin or staff access is required to cancel as admin.",
        },
        { status: 403 }
      )
    }

    const payment = (order.payment || {}) as Record<string, unknown>
    const paymentStatus = String(payment.status || "pending")
    const razorpayPaymentId = String(payment.razorpayPaymentId || "")
    const currentStatus = String(order.status || "")
    const now = new Date().toISOString()
    let refund: RefundResponse | null = null
    let refundStatus = "not_required"

    if (currentStatus === "cancelled") {
      return NextResponse.json({
        ok: true,
        orderId,
        status: "cancelled",
        message: "Order is already cancelled.",
      })
    }

    if (["shipped", "in_transit", "delivered", "return_requested"].includes(currentStatus)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            currentStatus === "delivered" || currentStatus === "return_requested"
              ? "Delivered orders cannot be cancelled. Please use return."
              : "This order has already been shipped and cannot be cancelled.",
        },
        { status: 400 }
      )
    }

    if (paymentStatus === "success") {
      if (!razorpayPaymentId) {
        throw new Error("Razorpay payment id is missing for refund.")
      }

      refund = await razorpayFetch<RefundResponse>(
        `/payments/${razorpayPaymentId}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            notes: {
              orderId,
              reason: reason || "Order cancelled",
              cancelledBy: cancelledBy || "admin",
            },
          }),
        }
      )
      refundStatus = refund.status || "created"
    }

    await orderRef.update({
      status: "cancelled",
      cancelledAt: now,
      cancelledBy:
        auth.role === "admin" || auth.role === "staff"
          ? cancelledBy || "admin"
          : "customer",
      cancelReason: reason || "Order cancelled",
      "payment.refundStatus": refundStatus,
      "payment.razorpayRefund": refund,
      updatedAt: now,
    })

    return NextResponse.json({
      ok: true,
      orderId,
      refund,
      refundStatus,
      message:
        paymentStatus === "success"
          ? "Order cancelled. Razorpay refund has been initiated."
          : "Order cancelled.",
    })
  } catch (error) {
    console.error("RAZORPAY REFUND ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to cancel/refund Razorpay order.",
      },
      { status: 500 }
    )
  }
}
