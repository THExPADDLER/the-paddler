import { NextResponse } from "next/server"
import { doc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/phonepe/callback",
    message: "PhonePe callback endpoint is available.",
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    console.log("PHONEPE CALLBACK:", body)

    const merchantOrderId =
      body?.merchantOrderId ||
      body?.data?.merchantOrderId ||
      body?.payload?.merchantOrderId
    const paymentState =
      body?.state ||
      body?.data?.state ||
      body?.payload?.state ||
      body?.code ||
      "callback_received"

    if (merchantOrderId) {
      await updateDoc(doc(db, "orders", merchantOrderId), {
        "payment.status": String(paymentState).toLowerCase(),
        status:
          String(paymentState).toUpperCase() === "COMPLETED" ||
          String(paymentState).toUpperCase() === "SUCCESS"
            ? "paid"
            : "payment_update_received",
        phonepeCallback: body,
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      ok: true,
      message: "PhonePe callback received.",
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
