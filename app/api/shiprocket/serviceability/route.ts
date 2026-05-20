import { NextResponse } from "next/server"

import { checkShiprocketServiceability } from "@/lib/shiprocket"
import { getFallbackPincode } from "@/lib/serviceable-pincodes"

type CourierCompany = {
  courier_name?: string
  etd?: string
  estimated_delivery_days?: string | number
  rate?: number
  freight_charge?: number
  cod?: number
}

const getBestCourier = (data: Record<string, unknown>) => {
  const companies =
    (data.data as { available_courier_companies?: CourierCompany[] } | undefined)
      ?.available_courier_companies || []

  return companies[0] || null
}

const fallbackResponse = (pincode: string, reason?: string) => {
  const fallback = getFallbackPincode(pincode)

  if (!fallback) {
    return NextResponse.json({
      ok: true,
      pincode,
      serviceable: null,
      source: "fallback",
      message:
        "Approx delivery available. Final courier availability will be confirmed before dispatch.",
      shiprocketError: reason || null,
    })
  }

  return NextResponse.json({
    ok: true,
    pincode,
    serviceable: true,
    source: "fallback",
    city: fallback.city,
    state: fallback.state,
    courierName: null,
    etd: null,
    estimatedDeliveryDays: fallback.estimatedDeliveryDays,
    rate: null,
    message: `Delivery available in ${fallback.city}.`,
    shiprocketError: reason || null,
  })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const pincode = url.searchParams.get("pincode")?.replace(/\D/g, "").slice(0, 6)

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        {
          ok: false,
          message: "Valid 6-digit pincode is required.",
        },
        { status: 400 }
      )
    }

    const data = await checkShiprocketServiceability(pincode)
    const bestCourier = getBestCourier(data)
    const serviceable = Boolean(bestCourier)

    return NextResponse.json({
      ok: true,
      pincode,
      serviceable,
      source: "shiprocket",
      courierName: bestCourier?.courier_name || null,
      etd: bestCourier?.etd || null,
      estimatedDeliveryDays: bestCourier?.estimated_delivery_days || null,
      rate: bestCourier?.rate || bestCourier?.freight_charge || null,
      shiprocket: data,
      message: serviceable
        ? "Delivery is available for this pincode."
        : "Delivery is currently not serviceable for this pincode.",
    })
  } catch (error) {
    console.error("SHIPROCKET SERVICEABILITY ROUTE ERROR:", error)

    const url = new URL(request.url)
    const pincode = url.searchParams.get("pincode")?.replace(/\D/g, "").slice(0, 6)

    if (pincode?.length === 6) {
      return fallbackResponse(
        pincode,
        error instanceof Error ? error.message : "Shiprocket unavailable"
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to check pincode serviceability.",
      },
      { status: 500 }
    )
  }
}
