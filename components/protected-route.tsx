"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "@/lib/firebase"

type ProtectedRouteProps = {
  children: React.ReactNode
  adminOnly?: boolean
}

const ADMIN_EMAILS = ["vp982761@gmail.com", "thexpaddler@gmail.com"]

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem("user")
        router.push("/login")
        setChecking(false)
        return
      }

      const email = firebaseUser.email || ""

      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Customer",
          email,
          role: ADMIN_EMAILS.includes(email) ? "admin" : "customer",
        })
      )

      if (adminOnly && !ADMIN_EMAILS.includes(email)) {
        router.push("/")
        setChecking(false)
        return
      }

      setAllowed(true)
      setChecking(false)
    })

    return () => unsubscribe()
  }, [router, adminOnly])

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
