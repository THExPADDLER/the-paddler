"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "@/lib/firebase"
import { syncUserProfile, type UserRole } from "@/lib/sync-user-profile"

type ProtectedRouteProps = {
  children: React.ReactNode
  adminOnly?: boolean
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const allowedRoleKey = allowedRoles?.join(",") || ""

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem("user")
        router.push("/login")
        setChecking(false)
        return
      }

      let role: UserRole = "customer"

      try {
        const profile = await syncUserProfile(firebaseUser)
        role = profile.role
      } catch (error) {
        console.error("PROTECTED ROUTE USER PROFILE SAVE ERROR:", error)
        const fallbackEmail = firebaseUser.email || ""
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Customer",
            email: fallbackEmail,
            role,
          })
        )
      }

      const permittedRoles = allowedRoleKey
        ? (allowedRoleKey.split(",") as UserRole[])
        : adminOnly
          ? (["admin", "staff"] as UserRole[])
          : null

      if (permittedRoles && !permittedRoles.includes(role)) {
        router.push("/")
        setChecking(false)
        return
      }

      setAllowed(true)
      setChecking(false)
    })

    return () => unsubscribe()
  }, [router, adminOnly, allowedRoleKey])

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking access...
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}
