import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { trackShiprocketAwb } from "@/lib/shiprocket"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get("orderId")
    const awbParam = url.searchParams.get("awb")

    let awb = awbParam || ""
    let orderRef = null

    if (orderId) {
      orderRef = doc(db, "orders", orderId)
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
      awb = awb || order?.shipment?.awb || order?.trackingId || ""
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

    if (orderRef) {
      await updateDoc(orderRef, {
        "shipment.lastTrackingResponse": tracking,
        "shipment.lastTrackedAt": new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      ok: true,
      orderId,
      awb,
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
