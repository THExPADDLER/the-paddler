"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Instagram, Mail, MessageCircle } from "lucide-react"

const launchAt = new Date("2026-07-06T00:00:00+05:30").getTime()

const socials = [
  {
    label: "Instagram",
    handle: "@thepaddler.in",
    href: "https://instagram.com/thepaddler.in",
    icon: Instagram,
  },
  {
    label: "WhatsApp",
    handle: "+91 8103631364",
    href: "https://wa.me/918103631364",
    icon: MessageCircle,
  },
  {
    label: "Email",
    handle: "support@thepaddler.in",
    href: "mailto:support@thepaddler.in",
    icon: Mail,
  },
]

const getTimeLeft = (now: number) => {
  const distance = launchAt - now

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  }
}

export default function LaunchingSoonPage() {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const timeLeft = useMemo(() => getTimeLeft(now), [now])

  return (
    <main className="launching-stage relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="launching-grid absolute inset-0 opacity-70" />
      <div className="launching-scan absolute inset-x-0 top-0 h-px bg-white/50" />
      <div className="launching-beam launching-beam-a" />
      <div className="launching-beam launching-beam-b" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-center py-3">
          <Image
            src="/images/paddler-logo-removedbg.png"
            alt="THE PADDLER"
            width={300}
            height={100}
            priority
            className="h-20 w-auto object-contain sm:h-24"
          />
        </header>

        <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="launching-copy">
            <p className="launching-label mb-5 inline-flex border border-white/15 bg-white/5 px-4 py-3 text-[10px] font-black tracking-[0.42em] text-white/70 backdrop-blur">
              THE DROP IS LOADING
            </p>

            <h1 className="launching-title max-w-4xl text-[3rem] font-black leading-[0.88] tracking-normal sm:text-7xl lg:text-8xl">
              NOT LIVE YET.
              <span className="block text-white/45">NOT ORDINARY EITHER.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/68 sm:text-lg">
              THE PADDLER opens on 6 July. Small batch streetwear, limited
              quantities, no random restocks. Follow for instant launch alerts.
            </p>

            <div className="mt-10 grid max-w-3xl grid-cols-4 gap-2 sm:gap-4">
              {[
                ["DAYS", timeLeft.days],
                ["HRS", timeLeft.hours],
                ["MIN", timeLeft.minutes],
                ["SEC", timeLeft.seconds],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="launching-time-tile border border-white/15 bg-black/50 p-3 text-center backdrop-blur sm:p-5"
                >
                  <p className="text-2xl font-black sm:text-4xl">
                    {String(value).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-[9px] tracking-[0.28em] text-white/45 sm:text-[10px]">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {socials.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    className="group inline-flex items-center gap-3 border border-white/15 bg-white/5 px-5 py-4 text-sm font-black transition hover:border-white hover:bg-white hover:text-black"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="launching-panel relative min-h-[28rem] overflow-hidden border border-white/15 bg-white/[0.03] p-6 backdrop-blur">
            <div className="absolute inset-x-0 top-0 border-y border-white/10 bg-white/5 py-2 text-xs font-black tracking-[0.42em] text-white/35">
              <div className="animate-marquee whitespace-nowrap">
                LIMITED DROP / OVERSIZED FIT / 240 GSM / BUILT FOR THE STREETS /
                LIMITED DROP / OVERSIZED FIT / 240 GSM /
              </div>
            </div>

            <div className="relative mt-16 flex h-full min-h-[20rem] flex-col justify-end">
              <p className="text-[28vw] font-black leading-none text-white/[0.04] sm:text-[12rem]">
                06
              </p>

              <div className="launching-card border border-white/15 bg-black/60 p-5 shadow-2xl backdrop-blur">
                <p className="text-xs font-black tracking-[0.35em] text-lime-300">
                  JULY 2026
                </p>
                <h2 className="mt-3 text-3xl font-black leading-none sm:text-5xl">
                  THE FIRST REAL DROP.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/55">
                  Until launch, the store stays locked. Watch Instagram and
                  WhatsApp for product previews, size notes, and exact drop time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-5 text-xs font-black tracking-[0.24em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>THE PADDLER</span>
          <span>FOLLOW FOR INSTANT UPDATES</span>
        </footer>
      </div>
    </main>
  )
}
