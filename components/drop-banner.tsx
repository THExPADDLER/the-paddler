"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

type CountdownSettings = {
  countdownAt?: string
  countdownTitle?: string
  countdownEnabled?: boolean
}

const getTimeLeft = (target?: string) => {
  if (!target) return null

  const endAt = new Date(target).getTime()
  const distance = endAt - Date.now()

  if (!Number.isFinite(endAt) || distance <= 0) return null

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  }
}

export function DropBanner() {
  const [countdownAt, setCountdownAt] = useState("")
  const [countdownTitle, setCountdownTitle] = useState("")
  const [countdownEnabled, setCountdownEnabled] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "homepage"))
        if (!snap.exists()) return

        const data = snap.data() as CountdownSettings
        setCountdownAt(data.countdownAt || "")
        setCountdownTitle(data.countdownTitle || "")
        setCountdownEnabled(data.countdownEnabled !== false)
      } catch (error) {
        console.error("DROP BANNER COUNTDOWN FETCH ERROR:", error)
      }
    }

    fetchCountdown()
  }, [])

  useEffect(() => {
    if (!countdownAt || !countdownEnabled) return

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [countdownAt, countdownEnabled])

  const timeLeft = useMemo(() => {
    void now
    if (!countdownEnabled) return null
    return getTimeLeft(countdownAt)
  }, [countdownAt, countdownEnabled, now])

  return (
    <section className="relative overflow-hidden bg-background text-foreground py-16 sm:py-20 border-y border-border">
      <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_22px,rgba(255,255,255,0.07)_23px,transparent_24px)]" />
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="relative text-xs tracking-[0.4em] text-accent mb-4">
          {countdownTitle || "DROP IS LIVE"}
        </p>

        <h2 className="relative text-3xl sm:text-5xl font-black mb-5">
          LIMITED PIECES ONLY
        </h2>

        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Once it's gone, it's gone. No restocks unless the streets demand it.
        </p>

        {timeLeft && (
          <div className="relative grid grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto mb-10">
            {[
              ["DAYS", timeLeft.days],
              ["HRS", timeLeft.hours],
              ["MIN", timeLeft.minutes],
              ["SEC", timeLeft.seconds],
            ].map(([label, value]) => (
              <div
                key={label}
                className="count-card border border-border p-3 sm:p-5 bg-secondary/20"
              >
                <p className="text-2xl sm:text-3xl font-black">
                  {String(value).padStart(2, "0")}
                </p>
                <p className="text-xs tracking-[0.25em] text-muted-foreground mt-2">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/shop"
          className="hero-cta relative inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-black"
        >
          SHOP DROP
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
