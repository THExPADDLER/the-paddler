"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { doc, onSnapshot } from "firebase/firestore"

import { db } from "@/lib/firebase"

const allowedDuringMaintenance = [
  "/maintenance",
  "/launching-soon",
  "/admin",
  "/login",
  "/forgot-password",
]

const isAllowedPath = (pathname: string) =>
  allowedDuringMaintenance.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

export function MaintenanceGate() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "siteSettings", "maintenance"),
      (snapshot) => {
        const enabled = snapshot.exists() && snapshot.data().enabled === true
        const mode = snapshot.exists() ? snapshot.data().mode : undefined
        const targetPath = mode === "launching" ? "/launching-soon" : "/maintenance"
        const allowed = isAllowedPath(pathname)

        if (enabled && !allowed) {
          router.replace(targetPath)
          return
        }

        if (enabled && pathname === "/maintenance" && targetPath === "/launching-soon") {
          router.replace("/launching-soon")
          return
        }

        if (enabled && pathname === "/launching-soon" && targetPath === "/maintenance") {
          router.replace("/maintenance")
          return
        }

        if (!enabled && (pathname === "/maintenance" || pathname === "/launching-soon")) {
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
