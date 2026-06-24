import { NextResponse } from "next/server"

import { serverDb } from "@/lib/firebase-server"
import { getRazorpayKeyId, razorpayFetch } from "@/lib/razorpay"
import { assertOrderAccess, requireUserRequest } from "@/lib/admin-auth"

export const runtime = "nodejs"

type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt?: string
  status?: string
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserRequest(request)
    const { orderId, amount, customer } = await request.json()

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
    assertOrderAccess(auth, order, "pay for this order")

    if (order?.payment?.status === "success") {
      return NextResponse.json(
        {
          ok: false,
          message: "Payment is already successful for this order.",
        },
        { status: 400 }
      )
    }

    if (order?.status === "cancelled") {
      return NextResponse.json(
        {
          ok: false,
          message: "Cancelled orders cannot be paid again.",
        },
        { status: 400 }
      )
    }

    const savedTotal = Number(order?.pricing?.total || 0)

    if (!Number.isFinite(savedTotal) || savedTotal <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order total is invalid.",
        },
        { status: 400 }
      )
    }

    if (
      amount !== undefined &&
      Math.round(Number(amount) * 100) !== Math.round(savedTotal * 100)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Payment amount does not match the order total.",
        },
        { status: 400 }
      )
    }

    const amountInPaise = Math.round(savedTotal * 100)
    const razorpayOrder = await razorpayFetch<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId,
        notes: {
          appOrderId: orderId,
          customerEmail: customer?.email || "",
          customerPhone: customer?.phone || "",
          brand: "THE PADDLER",
        },
      }),
    })

    await orderRef.update({
      "payment.gateway": "razorpay",
      "payment.status": "pending",
      "payment.razorpayOrderId": razorpayOrder.id,
      "payment.razorpayOrder": razorpayOrder,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      keyId: getRazorpayKeyId(),
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error("RAZORPAY CREATE ORDER ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Razorpay order.",
      },
      { status: 500 }
    )
  }
}
