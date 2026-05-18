"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, Clock3, Package, Truck } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

type TrackingResult = {
  ok: boolean
  orderId?: string
  awb?: string
  tracking?: Record<string, unknown>
  message?: string
}

const findTrackingData = (tracking?: Record<string, unknown>) => {
  const root = tracking || {}
  const data = root.tracking_data as Record<string, unknown> | undefined
  const shipmentTrack = data?.shipment_track as Record<string, unknown>[] | undefined
  const shipmentActivities = data?.shipment_track_activities as
    | Record<string, unknown>[]
    | undefined

  return {
    currentStatus:
      shipmentTrack?.[0]?.current_status ||
      shipmentTrack?.[0]?.delivered_to ||
      data?.track_status ||
      "Tracking requested",
    courier:
      shipmentTrack?.[0]?.courier_name ||
      shipmentTrack?.[0]?.courier_company_id ||
      "Shiprocket",
    activities: shipmentActivities || [],
    raw: root,
  }
}

export default function TrackingPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<TrackingResult | null>(null)

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/shiprocket/track?orderId=${encodeURIComponent(orderId)}`
        )
        const data = await response.json()
        setResult(data)
      } catch (error) {
        console.error("TRACKING PAGE ERROR:", error)
        setResult({
          ok: false,
          message: "Unable to load tracking right now.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTracking()
  }, [orderId])

  const trackingData = useMemo(
    () => findTrackingData(result?.tracking),
    [result?.tracking]
  )

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            SHIPMENT TRACKING
          </p>

          <h1 className="text-4xl font-black mb-10">TRACK ORDER</h1>

          <div className="border border-border bg-secondary/20 p-6 sm:p-8">
            {loading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock3 className="w-5 h-5 text-yellow-400" />
                Fetching latest tracking from Shiprocket...
              </div>
            ) : !result?.ok ? (
              <div>
                <Package className="w-10 h-10 text-muted-foreground mb-5" />
                <h2 className="text-2xl font-black mb-3">TRACKING NOT READY</h2>
                <p className="text-muted-foreground">
                  {result?.message ||
                    "AWB may still be processing. Please check again later."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-5 mb-8">
                  <div>
                    <p className="text-xs text-muted-foreground">ORDER ID</p>
                    <p className="font-black break-all">#{orderId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">AWB</p>
                    <p className="font-black">{result.awb || "Processing"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">COURIER</p>
                    <p className="font-black">{String(trackingData.courier)}</p>
                  </div>
                </div>

                <div className="border border-border bg-background/40 p-5 mb-8">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">CURRENT STATUS</p>
                      <h2 className="text-2xl font-black">
                        {String(trackingData.currentStatus)}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {trackingData.activities.length === 0 ? (
                    <p className="text-muted-foreground">
                      Shiprocket has not returned scan activities yet.
                    </p>
                  ) : (
                    trackingData.activities.map((activity, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          {index < trackingData.activities.length - 1 && (
                            <div className="w-px h-10 bg-border mt-2" />
                          )}
                        </div>

                        <div>
                          <p className="font-black">
                            {String(
                              activity.activity ||
                                activity.status ||
                                activity["sr-status-label"] ||
                                "Shipment update"
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {String(activity.date || activity.updated_date || "")}
                          </p>
                          {Boolean(activity.location) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {String(activity.location)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/orders"
              className="border border-border px-5 py-3 text-sm font-black hover:bg-secondary"
            >
              MY ORDERS
            </Link>
            <Link
              href="/shop"
              className="bg-foreground text-background px-5 py-3 text-sm font-black"
            >
              SHOP
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
