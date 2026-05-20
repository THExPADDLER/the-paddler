"use client"

import { useEffect, useMemo, useState } from "react"
import { IndianRupee, RotateCcw, Save, TicketPercent, Users } from "lucide-react"
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"

type Coupon = {
  code: string
  influencer?: string
  discountPercent?: number
  commissionPerOrder?: number
  active?: boolean
  createdAt?: string
}

type OrderRecord = {
  id: string
  status?: string
  pricing?: {
    total?: number
    couponCode?: string | null
  }
  payment?: {
    status?: string
  }
}

const isPaidOrder = (order: OrderRecord) => {
  const orderStatus = order.status?.toLowerCase()
  const paymentStatus = order.payment?.status?.toLowerCase()

  return (
    orderStatus === "paid" ||
    orderStatus === "shipped" ||
    orderStatus === "delivered" ||
    paymentStatus === "success" ||
    paymentStatus === "completed"
  )
}

const isRefundedOrder = (order: OrderRecord) => {
  const status = order.status?.toLowerCase() || ""
  return status.includes("refund") || status.includes("return")
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    code: "",
    influencer: "",
    discountPercent: "10",
    commissionPerOrder: "100",
  })
  const [filterCode, setFilterCode] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      const [couponsSnap, ordersSnap] = await Promise.all([
        getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "orders")),
      ])

      setCoupons(
        couponsSnap.docs.map((item) => ({
          code: item.id,
          ...(item.data() as Omit<Coupon, "code">),
        }))
      )
      setOrders(
        ordersSnap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<OrderRecord, "id">),
        }))
      )
    } catch (error) {
      console.error("ADMIN COUPONS FETCH ERROR:", error)
      setCoupons([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const couponStats = useMemo(() => {
    return coupons.map((coupon) => {
      const couponOrders = orders.filter(
        (order) =>
          order.pricing?.couponCode?.toUpperCase() === coupon.code.toUpperCase()
      )
      const successfulOrders = couponOrders.filter(isPaidOrder)
      const refundedOrders = couponOrders.filter(isRefundedOrder)
      const commissionPayable =
        successfulOrders.length * Number(coupon.commissionPerOrder || 0)

      return {
        ...coupon,
        totalUses: couponOrders.length,
        successfulOrders: successfulOrders.length,
        refundedOrders: refundedOrders.length,
        revenue: successfulOrders.reduce(
          (sum, order) => sum + Number(order.pricing?.total || 0),
          0
        ),
        commissionPayable,
      }
    })
  }, [coupons, orders])

  const summary = useMemo(
    () =>
      couponStats.reduce(
        (total, coupon) => ({
          totalUses: total.totalUses + coupon.totalUses,
          successfulOrders: total.successfulOrders + coupon.successfulOrders,
          refundedOrders: total.refundedOrders + coupon.refundedOrders,
          commissionPayable:
            total.commissionPayable + coupon.commissionPayable,
        }),
        {
          totalUses: 0,
          successfulOrders: 0,
          refundedOrders: 0,
          commissionPayable: 0,
        }
      ),
    [couponStats]
  )

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    const code = form.code.trim().toUpperCase()

    if (!code) {
      alert("Enter coupon code.")
      return
    }

    await setDoc(doc(db, "coupons", code), {
      influencer: form.influencer.trim() || "Direct",
      discountPercent: Number(form.discountPercent),
      commissionPerOrder: Number(form.commissionPerOrder),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setForm({
      code: "",
      influencer: "",
      discountPercent: "10",
      commissionPerOrder: "100",
    })
    await fetchData()
    alert("Coupon saved.")
  }

  const toggleCoupon = async (coupon: Coupon) => {
    await updateDoc(doc(db, "coupons", coupon.code), {
      active: coupon.active === false,
      updatedAt: new Date().toISOString(),
    })
    await fetchData()
  }

  const visibleCoupons = filterCode
    ? couponStats.filter((coupon) => coupon.code === filterCode)
    : couponStats

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              INFLUENCER COUPON CONTROL
            </p>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-black">COUPONS</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Create codes, track usage, and calculate commission.
                </p>
              </div>

              {filterCode && (
                <button
                  type="button"
                  onClick={() => setFilterCode(null)}
                  className="border border-border px-5 py-3 text-sm font-black hover:bg-secondary"
                >
                  SHOW ALL COUPONS
                </button>
              )}
            </div>

            <form
              onSubmit={handleSave}
              className="border border-border bg-secondary/20 p-5 mb-10 grid md:grid-cols-5 gap-4"
            >
              <input
                placeholder="Coupon code"
                className="bg-background border border-border px-4 py-3 outline-none text-white"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
              />
              <input
                placeholder="Influencer / source"
                className="bg-background border border-border px-4 py-3 outline-none text-white"
                value={form.influencer}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    influencer: event.target.value,
                  }))
                }
              />
              <input
                type="number"
                placeholder="Discount %"
                className="bg-background border border-border px-4 py-3 outline-none text-white"
                value={form.discountPercent}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discountPercent: event.target.value,
                  }))
                }
              />
              <input
                type="number"
                placeholder="Commission/order"
                className="bg-background border border-border px-4 py-3 outline-none text-white"
                value={form.commissionPerOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    commissionPerOrder: event.target.value,
                  }))
                }
              />
              <button className="bg-foreground text-background px-5 py-3 font-black flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                SAVE
              </button>
            </form>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              <div className="border border-border bg-secondary/20 p-6">
                <TicketPercent className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <h2 className="text-3xl font-black mt-2">
                  {loading ? "..." : summary.totalUses}
                </h2>
              </div>

              <div className="border border-border bg-secondary/20 p-6">
                <Users className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Successful Orders</p>
                <h2 className="text-3xl font-black mt-2">
                  {loading ? "..." : summary.successfulOrders}
                </h2>
              </div>

              <div className="border border-border bg-secondary/20 p-6">
                <RotateCcw className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Refunded Orders</p>
                <h2 className="text-3xl font-black mt-2">
                  {loading ? "..." : summary.refundedOrders}
                </h2>
              </div>

              <div className="border border-border bg-secondary/20 p-6">
                <IndianRupee className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Commission Payable</p>
                <h2 className="text-3xl font-black mt-2">
                  ₹{summary.commissionPayable.toLocaleString("en-IN")}
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {visibleCoupons.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  No coupons created yet.
                </div>
              ) : (
                visibleCoupons.map((coupon) => (
                  <div
                    key={coupon.code}
                    className="border border-border bg-secondary/20 p-6"
                  >
                    <div className="grid lg:grid-cols-8 gap-6 items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">COUPON</p>
                        <h2 className="text-xl font-black">{coupon.code}</h2>
                        <p
                          className={`text-xs font-black mt-1 ${
                            coupon.active === false
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {coupon.active === false ? "DISABLED" : "ACTIVE"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          INFLUENCER
                        </p>
                        <p className="font-black">
                          {coupon.influencer || "Direct"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">DISCOUNT</p>
                        <p className="font-black">
                          {coupon.discountPercent || 0}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          TOTAL USES
                        </p>
                        <p className="font-black">{coupon.totalUses}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          SUCCESSFUL
                        </p>
                        <p className="font-black text-green-400">
                          {coupon.successfulOrders}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">REFUNDED</p>
                        <p className="font-black text-red-400">
                          {coupon.refundedOrders}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">REVENUE</p>
                        <p className="font-black">
                          ₹{coupon.revenue.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          COMMISSION
                        </p>
                        <p className="font-black">
                          ₹{coupon.commissionPayable.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setFilterCode(coupon.code)}
                        className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary"
                      >
                        VIEW ONLY THIS CODE
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCoupon(coupon)}
                        className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary"
                      >
                        {coupon.active === false ? "ENABLE" : "DISABLE"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
