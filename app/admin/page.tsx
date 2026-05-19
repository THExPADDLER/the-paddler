"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Package,
  Users,
  IndianRupee,
  TicketPercent,
  ShoppingBag,
  RotateCcw,
  ImageIcon,
  Star,
} from "lucide-react"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"
import { products as localProducts } from "@/lib/products"

type DashboardStats = {
  totalOrders: number
  revenue: number
  products: number
  users: number
  couponsUsed: number
}

type OrderRecord = {
  userId?: string
  status?: string
  pricing?: {
    total?: number
    couponCode?: string | null
  }
  payment?: {
    status?: string
  }
}

const emptyStats: DashboardStats = {
  totalOrders: 0,
  revenue: 0,
  products: localProducts.length,
  users: 0,
  couponsUsed: 0,
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

const isPaidOrder = (order: OrderRecord) => {
  const orderStatus = order.status?.toLowerCase()
  const paymentStatus = order.payment?.status?.toLowerCase()

  return (
    orderStatus === "paid" ||
    orderStatus === "delivered" ||
    orderStatus === "shipped" ||
    paymentStatus === "success" ||
    paymentStatus === "completed"
  )
}

const links = [
  {
    title: "Products",
    href: "/admin/products",
    desc: "Add products, manage stock, mark sold out.",
    icon: ShoppingBag,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    desc: "View orders, tracking, payment and delivery status.",
    icon: Package,
  },
  {
    title: "Users",
    href: "/admin/users",
    desc: "View customers, addresses and reset password.",
    icon: Users,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    desc: "Influencer coupon usage and commission tracking.",
    icon: TicketPercent,
  },
  {
    title: "Returns",
    href: "/admin/returns",
    desc: "Approve returns and initiate refunds.",
    icon: RotateCcw,
  },
  {
    title: "Banner Control",
    href: "/admin/banner",
    desc: "Manage homepage banners, countdown and announcements.",
    icon: ImageIcon,
  },
  {
    title: "Featured Products",
    href: "/admin/featured-products",
    desc: "Choose which products appear on the landing page.",
    icon: Star,
  },
]

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loadingStats, setLoadingStats] = useState(true)
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true)

        const [ordersResult, productsResult, usersResult] =
          await Promise.allSettled([
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "products")),
            getDocs(collection(db, "users")),
          ])

        const orders =
          ordersResult.status === "fulfilled"
            ? ordersResult.value.docs.map((item) => item.data() as OrderRecord)
            : []

        const productsCount =
          productsResult.status === "fulfilled" && productsResult.value.size > 0
            ? productsResult.value.size
            : localProducts.length

        const usersFromCollection =
          usersResult.status === "fulfilled" ? usersResult.value.size : 0
        const uniqueOrderUsers = new Set(
          orders.map((order) => order.userId).filter(Boolean)
        ).size

        setStats({
          totalOrders: orders.length,
          revenue: orders
            .filter(isPaidOrder)
            .reduce((sum, order) => sum + Number(order.pricing?.total || 0), 0),
          products: productsCount,
          users: usersFromCollection || uniqueOrderUsers,
          couponsUsed: orders.filter((order) => order.pricing?.couponCode)
            .length,
        })
      } catch (error) {
        console.error("ADMIN DASHBOARD STATS ERROR:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const snapshot = await getDoc(doc(db, "siteSettings", "maintenance"))
        setMaintenanceEnabled(snapshot.exists() && snapshot.data().enabled === true)
      } catch (error) {
        console.error("MAINTENANCE MODE FETCH ERROR:", error)
      }
    }

    fetchMaintenanceMode()
  }, [])

  const toggleMaintenanceMode = async () => {
    const nextEnabled = !maintenanceEnabled
    const confirmed = window.confirm(
      nextEnabled
        ? "Take the live website down for maintenance? Customers will see the maintenance page."
        : "Make the live website available to customers again?"
    )

    if (!confirmed) return

    setSavingMaintenance(true)

    try {
      await setDoc(
        doc(db, "siteSettings", "maintenance"),
        {
          enabled: nextEnabled,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      setMaintenanceEnabled(nextEnabled)
      alert(nextEnabled ? "Site is now in maintenance mode." : "Site is live again.")
    } catch (error) {
      console.error("MAINTENANCE MODE SAVE ERROR:", error)
      alert("Unable to update maintenance mode.")
    } finally {
      setSavingMaintenance(false)
    }
  }

  const statCards = useMemo(
    () => [
      {
        title: "Total Orders",
        value: stats.totalOrders.toLocaleString("en-IN"),
        icon: Package,
        href: "/admin/orders",
      },
      {
        title: "Revenue",
        value: formatCurrency(stats.revenue),
        icon: IndianRupee,
        href: "/admin/orders",
      },
      {
        title: "Products",
        value: stats.products.toLocaleString("en-IN"),
        icon: ShoppingBag,
        href: "/admin/products",
      },
      {
        title: "Users",
        value: stats.users.toLocaleString("en-IN"),
        icon: Users,
        href: "/admin/users",
      },
      {
        title: "Coupons Used",
        value: stats.couponsUsed.toLocaleString("en-IN"),
        icon: TicketPercent,
        href: "/admin/coupons",
      },
    ],
    [stats]
  )

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              THE PADDLER CONTROL ROOM
            </p>

            <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <h1 className="text-4xl sm:text-5xl font-black">
                ADMIN PANEL
              </h1>

              <button
                type="button"
                onClick={toggleMaintenanceMode}
                disabled={savingMaintenance}
                className={`px-6 py-3 text-sm font-black transition-colors disabled:opacity-60 ${
                  maintenanceEnabled
                    ? "bg-green-400 text-black hover:bg-green-300"
                    : "bg-red-500 text-white hover:bg-red-400"
                }`}
              >
                {savingMaintenance
                  ? "UPDATING..."
                  : maintenanceEnabled
                  ? "MAKE SITE LIVE"
                  : "TAKE SITE DOWN"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {statCards.map((item) => {
                const Icon = item.icon
                const content = (
                  <>
                    <Icon className="w-6 h-6 text-muted-foreground mb-5 group-hover:text-foreground transition-colors" />

                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                      {loadingStats ? "..." : item.value}
                    </h2>
                  </>
                )

                return item.href ? (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group border border-border bg-secondary/20 p-6 hover:bg-secondary transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={item.title}
                    className="group border border-border bg-secondary/20 p-6"
                  >
                    {content}
                  </div>
                )
              })}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {links.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border border-border bg-secondary/20 p-6 hover:bg-secondary transition-colors group"
                  >
                    <Icon className="w-6 h-6 text-muted-foreground mb-5 group-hover:text-foreground transition-colors" />

                    <h2 className="text-xl font-black mb-2">{item.title}</h2>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </Link>
                )
              })}
            </div>

            <div className="mt-12 border border-border bg-secondary/20 p-6">
              <h2 className="text-2xl font-black mb-4">BACKEND STATUS</h2>

              <p className="text-muted-foreground leading-relaxed">
                Dashboard stats now read from Firestore. Products fall back to
                local catalog data when Firestore is empty, and users are counted
                from the users collection or unique customer orders.
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
