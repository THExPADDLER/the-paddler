"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, Mail, Package, Trash2 } from "lucide-react"
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"

type NotifyRequest = {
  id: string
  productSlug?: string
  productName?: string
  email?: string
  source?: string
  status?: string
  createdAt?: string
}

export default function AdminNotifyPage() {
  const [requests, setRequests] = useState<NotifyRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const notifyQuery = query(
        collection(db, "notifyRequests"),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(notifyQuery)

      setRequests(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<NotifyRequest, "id">),
        }))
      )
    } catch (error) {
      console.error("ADMIN NOTIFY FETCH ERROR:", error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const groupedRequests = useMemo(() => {
    const groups = new Map<
      string,
      { productName: string; productSlug: string; requests: NotifyRequest[] }
    >()

    requests.forEach((request) => {
      const key = request.productSlug || request.productName || "unknown"

      if (!groups.has(key)) {
        groups.set(key, {
          productName: request.productName || "Unknown Product",
          productSlug: request.productSlug || "unknown",
          requests: [],
        })
      }

      groups.get(key)?.requests.push(request)
    })

    return Array.from(groups.values()).sort(
      (a, b) => b.requests.length - a.requests.length
    )
  }, [requests])

  const handleDelete = async (requestId: string) => {
    const confirmed = window.confirm("Delete this notify request?")

    if (!confirmed) return

    await deleteDoc(doc(db, "notifyRequests", requestId))
    await fetchRequests()
  }

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER DEMAND
            </p>

            <h1 className="text-4xl font-black mb-10">NOTIFY REQUESTS</h1>

            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              <div className="border border-border bg-secondary/20 p-6">
                <Bell className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <h2 className="text-3xl font-black mt-2">
                  {loading ? "..." : requests.length}
                </h2>
              </div>

              <div className="border border-border bg-secondary/20 p-6">
                <Package className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Products Requested</p>
                <h2 className="text-3xl font-black mt-2">
                  {loading ? "..." : groupedRequests.length}
                </h2>
              </div>

              <div className="border border-border bg-secondary/20 p-6">
                <Mail className="w-6 h-6 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Unique Emails</p>
                <h2 className="text-3xl font-black mt-2">
                  {loading
                    ? "..."
                    : new Set(requests.map((item) => item.email).filter(Boolean))
                        .size}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  Loading notify requests...
                </div>
              ) : groupedRequests.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-6 text-muted-foreground">
                  No notify requests yet.
                </div>
              ) : (
                groupedRequests.map((group) => (
                  <div
                    key={group.productSlug}
                    className="border border-border bg-secondary/20 p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-5 mb-5">
                      <div>
                        <p className="text-xs text-muted-foreground">PRODUCT</p>
                        <h2 className="text-xl font-black">{group.productName}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.productSlug}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-muted-foreground">REQUESTS</p>
                        <p className="text-3xl font-black">
                          {group.requests.length}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      {group.requests.map((request) => (
                        <div
                          key={request.id}
                          className="border border-border bg-background/50 p-4 flex items-start justify-between gap-4"
                        >
                          <div>
                            <p className="font-bold break-all">
                              {request.email || "No email"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {request.source || "site"} /{" "}
                              {request.createdAt
                                ? new Date(request.createdAt).toLocaleString("en-IN")
                                : "No date"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(request.id)}
                            className="p-2 border border-border text-red-400 hover:bg-secondary"
                            aria-label="Delete notify request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
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
