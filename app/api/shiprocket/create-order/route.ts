import { NextResponse } from "next/server"

import { createShiprocketShipmentForOrder } from "@/lib/shiprocket"

export async function POST(request: Request) {
  try {
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

    const shipment = await createShiprocketShipmentForOrder(orderId)

    return NextResponse.json({
      ok: true,
      orderId,
      shipment,
    })
  } catch (error) {
    console.error("SHIPROCKET CREATE ORDER ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Shiprocket order.",
      },
      { status: 500 }
    )
  }
}
