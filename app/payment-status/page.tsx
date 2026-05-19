"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

type PaymentResult = {
  ok: boolean
  orderId?: string
  status?: string
  paymentStatus?: string
  phonepeState?: string
  message?: string
  shipmentError?: string | null
  inventoryError?: string | null
}

const getTitle = (result: PaymentResult | null, loading: boolean) => {
  if (loading) return "CHECKING PAYMENT"
  if (!result?.ok) return "PAYMENT STATUS UNKNOWN"
  if (result.paymentStatus === "success") return "PAYMENT SUCCESSFUL"
  if (result.paymentStatus === "failed") return "PAYMENT FAILED"
  return "PAYMENT PENDING"
}

const getMessage = (result: PaymentResult | null, loading: boolean) => {
  if (loading) {
    return "Please wait while we confirm your payment with PhonePe."
  }

  if (!result?.ok) {
    return result?.message || "We could not confirm the payment right now."
  }

  if (result.paymentStatus === "success") {
    return "Your payment was successful. Your order is now confirmed."
  }

  if (result.paymentStatus === "failed") {
    return "Your payment failed. You can try placing the order again."
  }

  return "Your payment is still pending. We will update the order after PhonePe confirms it."
}

export default function PaymentStatusPage() {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [attempt, setAttempt] = useState(1)

  useEffect(() => {
    const checkStatus = async () => {
      const params = new URLSearchParams(window.location.search)
      const orderId = params.get("orderId")

      if (!orderId) {
        setResult({
          ok: false,
          message: "Missing order id.",
        })
        setLoading(false)
        return
      }

      const maxAttempts = 8

      for (let currentAttempt = 1; currentAttempt <= maxAttempts; currentAttempt += 1) {
        setAttempt(currentAttempt)

        try {
          const response = await fetch(
            `/api/phonepe/status?orderId=${encodeURIComponent(orderId)}&attempt=${currentAttempt}`,
            { cache: "no-store" }
          )
          const data = await response.json()

          setResult(data)

          if (
            data?.paymentStatus === "success" ||
            data?.paymentStatus === "failed" ||
            currentAttempt === maxAttempts
          ) {
            return
          }
        } catch (error) {
          console.error("PAYMENT STATUS PAGE ERROR:", error)

          if (currentAttempt === maxAttempts) {
            setResult({
              ok: false,
              message: "Unable to check payment status.",
            })
            return
          }
        } finally {
          if (currentAttempt === maxAttempts) {
            setLoading(false)
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      setLoading(false)
    }

    checkStatus().finally(() => setLoading(false))
  }, [])

  const title = getTitle(result, loading)
  const message = getMessage(result, loading)
  const status = result?.paymentStatus

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="border border-border bg-secondary/20 p-8 sm:p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-border flex items-center justify-center">
              {loading ? (
                <Clock3 className="w-9 h-9 text-yellow-400" />
              ) : status === "success" ? (
                <CheckCircle2 className="w-9 h-9 text-green-400" />
              ) : status === "failed" ? (
                <XCircle className="w-9 h-9 text-red-400" />
              ) : (
                <Clock3 className="w-9 h-9 text-yellow-400" />
              )}
            </div>

            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              PHONEPE PAYMENT
            </p>

            <h1 className="text-3xl sm:text-4xl font-black mb-5">
              {title}
            </h1>

            <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {message}
            </p>

            {loading && (
              <p className="text-xs text-muted-foreground mt-4">
                Attempt {attempt} of 8
              </p>
            )}

            {result?.paymentStatus === "success" &&
              (result.shipmentError || result.inventoryError) && (
                <p className="text-sm text-yellow-400 mt-5">
                  Payment is confirmed. Backend follow-up needs attention:
                  {" "}
                  {result.shipmentError || result.inventoryError}
                </p>
              )}

            {result?.orderId && (
              <p className="text-sm text-muted-foreground mt-6 break-all">
                Order ID: <span className="text-foreground font-bold">#{result.orderId}</span>
              </p>
            )}

            {result?.phonepeState && (
              <p className="text-sm text-muted-foreground mt-2">
                PhonePe status: <span className="text-foreground font-bold">{result.phonepeState}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link
                href="/orders"
                className="bg-foreground text-background px-8 py-4 text-sm font-black"
              >
                VIEW ORDERS
              </Link>

              <Link
                href="/shop"
                className="border border-border px-8 py-4 text-sm font-black hover:bg-secondary"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
