"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"

import { useAuth } from "@/app/providers/AuthProvider"
import { db } from "@/lib/firebase"
import type { CartItem } from "@/lib/cart-context"

type InvoiceOrder = {
  id: string
  invoiceNumber?: string
  userId: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  address?: {
    fullName: string
    phone: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  items: CartItem[]
  pricing: {
    subtotal?: number
    shipping?: number
    couponDiscount?: number
    total: number
  }
  payment?: {
    status?: string
    gateway?: string
  }
  createdAt: string
}

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<InvoiceOrder | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)

  const orderId = params.orderId as string

  useEffect(() => {
    const fetchOrder = async () => {
      if (loading) return

      if (!user) {
        router.push(`/login?redirect=/invoice/${orderId}`)
        return
      }

      try {
        setLoadingOrder(true)

        const orderSnap = await getDoc(doc(db, "orders", orderId))

        if (!orderSnap.exists()) {
          setOrder(null)
          return
        }

        const orderData = {
          id: orderSnap.id,
          ...(orderSnap.data() as Omit<InvoiceOrder, "id">),
        }

        if (orderData.userId !== user.uid) {
          setOrder(null)
          return
        }

        setOrder(orderData)
      } catch (error) {
        console.error("INVOICE FETCH ERROR:", error)
        setOrder(null)
      } finally {
        setLoadingOrder(false)
      }
    }

    fetchOrder()
  }, [loading, orderId, router, user])

  if (loadingOrder) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center">
        Loading invoice...
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-black mb-4">Invoice Not Found</h1>
          <Link href="/orders" className="underline">
            Back to orders
          </Link>
        </div>
      </main>
    )
  }

  const orderedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const subtotal =
    order.pricing.subtotal ||
    order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = order.pricing.shipping || 0
  const couponDiscount = order.pricing.couponDiscount || 0

  return (
    <main className="min-h-screen bg-white text-black py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <Link href="/orders" className="underline">
            Back to orders
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-3 font-bold"
          >
            PRINT / SAVE PDF
          </button>
        </div>

        <section className="border border-neutral-300 p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-neutral-300 pb-8">
            <div>
              <h1 className="text-3xl font-black">THE PADDLER</h1>
              <p className="text-sm text-neutral-600 mt-2">
                Premium streetwear
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm text-neutral-600">Invoice</p>
              <h2 className="font-black break-all">
                #{order.invoiceNumber || order.id}
              </h2>
              <p className="text-xs text-neutral-600 mt-1 break-all">
                Order ID: #{order.id}
              </p>
              <p className="text-sm text-neutral-600 mt-2">
                Date: {orderedDate}
              </p>
              <p className="text-sm text-neutral-600">
                Payment: {order.payment?.status || "pending"}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 py-8 border-b border-neutral-300">
            <div>
              <h3 className="font-black mb-3">Bill To</h3>
              <p>{order.customer?.name || order.address?.fullName}</p>
              <p>{order.customer?.email}</p>
              <p>{order.customer?.phone || order.address?.phone}</p>
            </div>

            <div>
              <h3 className="font-black mb-3">Ship To</h3>
              {order.address && (
                <>
                  <p>{order.address.fullName}</p>
                  <p>{order.address.address}</p>
                  {order.address.landmark && (
                    <p>Landmark: {order.address.landmark}</p>
                  )}
                  <p>
                    {order.address.city}, {order.address.state} -{" "}
                    {order.address.pincode}
                  </p>
                  <p>{order.address.phone}</p>
                </>
              )}
            </div>
          </div>

          <div className="py-8 border-b border-neutral-300">
            <div className="grid grid-cols-[1fr_80px_100px_110px] gap-4 text-sm font-black border-b border-neutral-300 pb-3">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span className="text-right">Total</span>
            </div>

            {order.items.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="grid grid-cols-[1fr_80px_100px_110px] gap-4 items-center py-4 border-b border-neutral-200 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-16 bg-neutral-100 print:hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-neutral-600">Size: {item.size}</p>
                  </div>
                </div>
                <span>{item.quantity}</span>
                <span>₹{item.price}</span>
                <span className="text-right">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="ml-auto max-w-sm py-8 space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Coupon Discount</span>
              <span>-₹{couponDiscount}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-4 text-xl font-black">
              <span>Total</span>
              <span>₹{order.pricing.total}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
