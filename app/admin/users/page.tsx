"use client"

import { useEffect, useMemo, useState } from "react"
import { Mail, ShoppingBag } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"

type OrderRecord = {
  id: string
  userId?: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  address?: {
    address?: string
    landmark?: string
    city?: string
    state?: string
    pincode?: string
  }
  pricing?: {
    total?: number
  }
  createdAt?: string
}

type CustomerSummary = {
  key: string
  name: string
  email: string
  phone: string
  address: string
  orders: number
  totalSpend: number
  joined: string
}

export default function AdminUsersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const snapshot = await getDocs(collection(db, "orders"))

        setOrders(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<OrderRecord, "id">),
          }))
        )
      } catch (error) {
        console.error("ADMIN USERS FETCH ERROR:", error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const users = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>()

    orders.forEach((order) => {
      const key = order.userId || order.customer?.email || order.id
      const existing = map.get(key)
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
      const addressParts = [
        order.address?.address,
        order.address?.landmark ? `Landmark: ${order.address.landmark}` : null,
        order.address?.city,
        order.address?.state,
        order.address?.pincode,
      ].filter(Boolean)

      if (!existing) {
        map.set(key, {
          key,
          name: order.customer?.name || "Customer",
          email: order.customer?.email || "No email",
          phone: order.customer?.phone || "No phone",
          address: addressParts.join(", ") || "No address saved",
          orders: 1,
          totalSpend: Number(order.pricing?.total || 0),
          joined: orderDate.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
        })
        return
      }

      existing.orders += 1
      existing.totalSpend += Number(order.pricing?.total || 0)
      if (existing.address === "No address saved" && addressParts.length > 0) {
        existing.address = addressParts.join(", ")
      }
    })

    return Array.from(map.values()).sort((a, b) => b.orders - a.orders)
  }, [orders])

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER CONTROL
            </p>

            <h1 className="text-4xl font-black mb-10">USERS</h1>

            <div className="space-y-5">
              {loading ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  No customer orders yet.
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.key}
                    className="border border-border bg-secondary/20 p-6"
                  >
                    <div className="grid lg:grid-cols-6 gap-6 items-start">
                      <div>
                        <p className="text-xs text-muted-foreground">NAME</p>
                        <h2 className="font-black">{user.name}</h2>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">EMAIL</p>
                        <p className="font-bold break-all">{user.email}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">PHONE</p>
                        <p className="font-bold">{user.phone}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">ADDRESS</p>
                        <p className="font-bold text-sm leading-relaxed">
                          {user.address}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">ORDERS</p>
                        <p className="font-black">{user.orders}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ₹{user.totalSpend.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">JOINED</p>
                        <p className="font-bold">{user.joined}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                      <a
                        href={`mailto:${user.email}`}
                        className="px-4 py-3 border border-border text-sm font-black hover:bg-secondary flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        EMAIL USER
                      </a>

                      <div className="px-4 py-3 border border-border text-sm font-black flex items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="w-4 h-4" />
                        {user.orders} ORDER{user.orders === 1 ? "" : "S"}
                      </div>
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
