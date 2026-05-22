"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

export function DropBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 12,
    minutes: 30,
    seconds: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev

        if (seconds > 0) seconds--
        else {
          seconds = 59
          if (minutes > 0) minutes--
          else {
            minutes = 59
            if (hours > 0) hours--
            else {
              hours = 23
              if (days > 0) days--
            }
          }
        }

        return { days, hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden bg-background text-foreground py-16 sm:py-20 border-y border-border">
      <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_22px,rgba(255,255,255,0.07)_23px,transparent_24px)]" />
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="relative text-xs tracking-[0.4em] text-accent mb-4">
          DROP IS LIVE
        </p>

        <h2 className="relative text-3xl sm:text-5xl font-black mb-5">
          LIMITED PIECES ONLY
        </h2>

        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Once it’s gone, it’s gone. No restocks unless the streets demand it.
        </p>

        <div className="relative grid grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto mb-10">
          {[
            ["DAYS", timeLeft.days],
            ["HRS", timeLeft.hours],
            ["MIN", timeLeft.minutes],
            ["SEC", timeLeft.seconds],
          ].map(([label, value]) => (
            <div key={label} className="count-card border border-border p-3 sm:p-5 bg-secondary/20">
              <p className="text-2xl sm:text-3xl font-black">
                {String(value).padStart(2, "0")}
              </p>
              <p className="text-xs tracking-[0.25em] text-muted-foreground mt-2">
                {label}
              </p>
            </div>
          ))}
        </div>

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
