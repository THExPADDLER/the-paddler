"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  Boxes,
  BadgePercent,
  FileDown,
} from "lucide-react"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { auth, db } from "@/lib/firebase"
import { products as localProducts } from "@/lib/products"
import type { UserRole } from "@/lib/sync-user-profile"

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
  const paymentStatus = order.payment?.status?.toLowerCase()

  return (
    paymentStatus === "success" ||
    paymentStatus === "completed" ||
    paymentStatus === "paid"
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
    title: "Inventory",
    href: "/admin/inventory",
    desc: "Manage shared color and size stock for blank tees.",
    icon: Boxes,
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
    desc: "View customers, addresses and account details.",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    desc: "Influencer coupon usage and commission tracking.",
    icon: TicketPercent,
    adminOnly: true,
  },
  {
    title: "Influencer Dashboard",
    href: "/admin/influencer",
    desc: "View coupon usage, sold tees, and generated commission.",
    icon: BadgePercent,
    influencerOnly: true,
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
  const [role, setRole] = useState<UserRole>("customer")
  const [loadingStats, setLoadingStats] = useState(true)
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [reportMenuOpen, setReportMenuOpen] = useState(false)
  const [reportFrom, setReportFrom] = useState("")
  const [reportTo, setReportTo] = useState("")
  const [downloadingReport, setDownloadingReport] = useState(false)
  const isAdmin = role === "admin"
  const isInfluencer = role === "influencer"

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) return

    try {
      const parsed = JSON.parse(storedUser) as { role?: UserRole }
      setRole(parsed.role || "customer")
    } catch {
      setRole("customer")
    }
  }, [])

  const fetchStats = useCallback(async () => {
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
        couponsUsed: orders.filter((order) => order.pricing?.couponCode).length,
      })
    } catch (error) {
      console.error("ADMIN DASHBOARD STATS ERROR:", error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

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

  const downloadOrderReport = async () => {
    try {
      if (reportFrom && reportTo && reportFrom > reportTo) {
        alert("From date cannot be after To date.")
        return
      }

      setDownloadingReport(true)
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        alert("Admin session expired. Please login again.")
        return
      }

      const reportResponse = await fetch("/api/admin/orders-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: reportFrom || null,
          to: reportTo || null,
        }),
      })

      if (!reportResponse.ok) {
        const error = await reportResponse.json().catch(() => null)
        alert(error?.message || "Unable to create report PDF.")
        return
      }

      const reportBlob = await reportResponse.blob()
      const fallbackName = `the-paddler-order-report-${
        reportFrom || "start"
      }-to-${reportTo || "today"}.pdf`
      const fileName = reportResponse.headers.get("X-Report-Filename") || fallbackName
      const url = URL.createObjectURL(reportBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setReportMenuOpen(false)
    } catch (error) {
      console.error("ADMIN ORDER REPORT DOWNLOAD ERROR:", error)
      alert("Unable to download report.")
    } finally {
      setDownloadingReport(false)
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
    <ProtectedRoute allowedRoles={["admin", "staff", "influencer"]}>
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

              {isAdmin && (
              <div className="flex flex-wrap items-start gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setReportMenuOpen((value) => !value)}
                    disabled={downloadingReport}
                    className="px-6 py-3 text-sm font-black border border-border hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      {downloadingReport ? "DOWNLOADING..." : "DOWNLOAD REPORT"}
                    </span>
                  </button>

                  {reportMenuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-3 w-96 border border-border bg-background p-5 shadow-xl">
                      <p className="text-sm font-black">ORDER REPORT PERIOD</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Select a date range. Leave both empty for all-time order report.
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-black text-muted-foreground">
                          FROM
                          <input
                            type="date"
                            value={reportFrom}
                            onChange={(event) => setReportFrom(event.target.value)}
                            className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none"
                          />
                        </label>

                        <label className="text-xs font-black text-muted-foreground">
                          TO
                          <input
                            type="date"
                            value={reportTo}
                            onChange={(event) => setReportTo(event.target.value)}
                            className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none"
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={downloadOrderReport}
                          disabled={downloadingReport}
                          className="flex-1 bg-foreground px-4 py-3 text-sm font-black text-background disabled:opacity-60"
                        >
                          DOWNLOAD PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReportFrom("")
                            setReportTo("")
                          }}
                          className="border border-border px-4 py-3 text-sm font-black"
                        >
                          ALL TIME
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
              )}
            </div>

            {isAdmin && (
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
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {links
                .filter((item) => {
                  if (isInfluencer) return item.influencerOnly
                  if (item.influencerOnly) return isAdmin
                  return isAdmin || !item.adminOnly
                })
                .map((item) => {
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
