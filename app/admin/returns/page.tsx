"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { CheckCircle2, RotateCcw, Truck, XCircle } from "lucide-react"
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"
import type { CartItem } from "@/lib/cart-context"

type ReturnRequest = {
  id: string
  orderId?: string
  customerEmail?: string
  items?: CartItem[]
  amount?: number
  reason?: string
  description?: string
  imageUrl?: string
  status?: string
  pickupStatus?: string
  refundStatus?: string
  adminSeen?: boolean
  seenAt?: string | null
  createdAt?: string
}

const formatStatus = (status = "pending") =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const returnsQuery = query(
        collection(db, "returns"),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(returnsQuery)
      const now = new Date().toISOString()
      const unseenDocs = snapshot.docs.filter(
        (item) => item.data().adminSeen !== true
      )

      setReturns(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<ReturnRequest, "id">),
        }))
      )

      if (unseenDocs.length > 0) {
        const batch = writeBatch(db)

        unseenDocs.forEach((item) => {
          batch.update(item.ref, {
            adminSeen: true,
            seenAt: now,
            updatedAt: now,
          })
        })

        await batch.commit()
      }
    } catch (error) {
      console.error("ADMIN RETURNS FETCH ERROR:", error)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [])

  const updateReturn = async (
    item: ReturnRequest,
    fields: Partial<ReturnRequest>
  ) => {
    setUpdatingId(item.id)

    try {
      await updateDoc(doc(db, "returns", item.id), {
        ...fields,
        updatedAt: new Date().toISOString(),
      })

      if (item.orderId && fields.status) {
        await updateDoc(doc(db, "orders", item.orderId), {
          status: fields.status,
          updatedAt: new Date().toISOString(),
        })
      }

      await fetchReturns()
    } catch (error) {
      console.error("RETURN UPDATE ERROR:", error)
      alert("Unable to update return.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              RETURNS & REFUNDS
            </p>

            <h1 className="text-4xl font-black mb-10">RETURN REQUESTS</h1>

            <div className="space-y-6">
              {loading ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  Loading return requests...
                </div>
              ) : returns.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  No return requests yet.
                </div>
              ) : (
                returns.map((item) => {
                  const firstItem = item.items?.[0]

                  return (
                    <div
                      key={item.id}
                      className="border border-border bg-secondary/20 p-6"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="relative w-24 h-28 bg-neutral-900 overflow-hidden">
                          {firstItem?.image && (
                            <Image
                              src={firstItem.image}
                              alt={firstItem.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              RETURN ID
                            </p>
                            <h2 className="font-black break-all">{item.id}</h2>
                            <p className="text-sm text-muted-foreground">
                              Order #{item.orderId || "Unknown"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              CUSTOMER
                            </p>
                            <h2 className="font-black break-all">
                              {item.customerEmail || "No email"}
                            </h2>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              PRODUCT
                            </p>
                            <h2 className="font-black">
                              {firstItem?.name || "Order items"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {item.reason || "No reason provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">AMOUNT</p>
                            <h2 className="font-black">
                              ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                            </h2>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-border grid md:grid-cols-3 gap-5">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            RETURN REASON
                          </p>
                          <p className="font-black mt-1">
                            {item.reason || "No reason provided"}
                          </p>
                          {item.description && (
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            RETURN STATUS
                          </p>
                          <p className="font-black text-yellow-400 mt-1">
                            {formatStatus(item.status)}
                          </p>
                        </div>

                        {item.imageUrl && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              CUSTOMER IMAGE
                            </p>
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block border border-border px-4 py-3 text-sm font-black hover:bg-secondary"
                            >
                              VIEW IMAGE
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-5 border-t border-border grid md:grid-cols-3 gap-5">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            PICKUP STATUS
                          </p>
                          <p className="font-black mt-1">
                            {formatStatus(item.pickupStatus)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            REFUND STATUS
                          </p>
                          <p className="font-black text-red-400 mt-1">
                            {formatStatus(item.refundStatus)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                        <button
                          onClick={() => updateReturn(item, { status: "return_approved" })}
                          disabled={updatingId === item.id}
                          className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          APPROVE RETURN
                        </button>

                        <button
                          onClick={() => updateReturn(item, { pickupStatus: "picked_up" })}
                          disabled={updatingId === item.id}
                          className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" />
                          MARK PICKED UP
                        </button>

                        <button
                          onClick={() =>
                            updateReturn(item, { refundStatus: "manual_refund_pending" })
                          }
                          disabled={updatingId === item.id}
                          className="px-4 py-3 bg-foreground text-background text-sm font-black hover:bg-foreground/90 flex items-center gap-2 disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          MARK REFUND PENDING
                        </button>

                        <button
                          onClick={() => updateReturn(item, { status: "return_rejected" })}
                          disabled={updatingId === item.id}
                          className="px-4 py-3 border border-border text-sm font-black text-red-400 hover:bg-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          REJECT
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
