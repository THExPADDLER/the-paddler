"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { doc, onSnapshot } from "firebase/firestore"

import { db } from "@/lib/firebase"

const allowedDuringMaintenance = [
  "/maintenance",
  "/admin",
  "/login",
  "/forgot-password",
]

export function MaintenanceGate() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "siteSettings", "maintenance"),
      (snapshot) => {
        const enabled = snapshot.exists() && snapshot.data().enabled === true
        const allowed = allowedDuringMaintenance.some((path) =>
          pathname === path || pathname.startsWith(`${path}/`)
        )

        if (enabled && !allowed) {
          router.replace("/maintenance")
          return
        }

        if (!enabled && pathname === "/maintenance") {
          router.replace("/")
        }
      },
      (error) => {
        console.error("MAINTENANCE MODE CHECK ERROR:", error)
      }
    )

    return () => unsubscribe()
  }, [pathname, router])

  return null
}
