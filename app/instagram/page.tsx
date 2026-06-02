"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { ArrowRight, Camera, ExternalLink, Instagram, Radio, Zap } from "lucide-react"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

const instagramHandle = "thepaddler.in"
const instagramUrl = `https://instagram.com/${instagramHandle}`

const contentSignals = [
  {
    title: "Drop Alerts",
    copy: "First look at new tees, launch dates, countdowns, and sold-out warnings.",
    icon: Zap,
  },
  {
    title: "Reel Energy",
    copy: "Short edits, street movement, product closeups, and outfit transitions.",
    icon: Camera,
  },
  {
    title: "Street Proof",
    copy: "Customer fits, creator shoots, and raw behind-the-scenes moments.",
    icon: Radio,
  },
]

const frames = [
  {
    image: "/images/street-2.jpg",
    label: "FIT CHECK",
    metric: "REELS",
    href: `https://www.instagram.com/${instagramHandle}/reels/`,
    external: true,
  },
  {
    image: "/images/products/black-tee-3.jpg",
    label: "DROP TEASER",
    metric: "POSTS",
    href: instagramUrl,
    external: true,
  },
  {
    image: "/images/street-4.jpg",
    label: "STREET FILE",
    metric: "CREATORS",
    href: "/influencers",
    external: false,
  },
]

const processInstagramEmbed = () => {
  const instagramWindow = window as Window & {
    instgrm?: { Embeds?: { process?: () => void } }
  }

  instagramWindow.instgrm?.Embeds?.process?.()
}

export default function InstagramPage() {
  useEffect(() => {
    processInstagramEmbed()
  }, [])

  return (
    <>
      <Header />

      <main className="instagram-signal-stage min-h-screen overflow-hidden bg-black pt-16 text-white">
        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b border-white/10">
          <div className="instagram-grid absolute inset-0 opacity-80" />
          <div className="signal-scan-line absolute left-0 top-0 h-full w-px bg-lime-200/40" />

          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="signal-copy">
              <p className="mb-4 inline-flex border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-bold tracking-[0.4em] text-white/70">
                LIVE SOCIAL SIGNAL
              </p>

              <h1 className="max-w-3xl text-5xl font-black leading-[0.9] sm:text-7xl lg:text-8xl">
                TAP INTO THE FEED
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/62 sm:text-lg">
                Follow @{instagramHandle} for drops, product shots, creator fits, and the streetwear pulse behind THE PADDLER.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-white px-7 py-4 text-sm font-black text-black hover:bg-lime-200"
                >
                  <Instagram className="h-5 w-5" />
                  Follow @{instagramHandle}
                  <ExternalLink className="h-4 w-4" />
                </a>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-3 border border-white/20 px-7 py-4 text-sm font-black text-white hover:border-white hover:bg-white hover:text-black"
                >
                  Shop The Drop
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid max-w-lg grid-cols-3 border border-white/10 bg-white/[0.03]">
                {["REELS", "DROPS", "FITS"].map((item) => (
                  <div key={item} className="border-r border-white/10 p-4 last:border-r-0">
                    <p className="text-2xl font-black">24/7</p>
                    <p className="mt-1 text-[10px] tracking-[0.32em] text-white/45">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="signal-phone-stack relative min-h-[560px]">
              {frames.map((frame, index) => (
                frame.external ? (
                  <a
                    key={frame.label}
                    href={frame.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`signal-phone-card signal-phone-card-${index + 1} group absolute overflow-hidden border border-white/15 bg-white/[0.04] p-3 shadow-2xl`}
                    aria-label={`Open ${frame.metric.toLowerCase()} on Instagram`}
                  >
                    <div className="relative aspect-[9/13] overflow-hidden bg-neutral-950">
                      <Image
                        src={frame.image}
                        alt={frame.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 72vw, 320px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                      <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                        <span className="border border-white/20 bg-black/50 px-3 py-2 text-[10px] font-black tracking-[0.25em]">
                          {frame.label}
                        </span>
                        <Instagram className="h-5 w-5 transition-transform group-hover:scale-125 group-hover:text-lime-200" />
                      </div>
                      <p className="absolute bottom-4 left-4 text-3xl font-black">{frame.metric}</p>
                      <span className="absolute bottom-5 right-4 text-[10px] font-black tracking-[0.28em] text-lime-200 opacity-0 transition-opacity group-hover:opacity-100">
                        OPEN
                      </span>
                    </div>
                  </a>
                ) : (
                  <Link
                    key={frame.label}
                    href={frame.href}
                    className={`signal-phone-card signal-phone-card-${index + 1} group absolute overflow-hidden border border-white/15 bg-white/[0.04] p-3 shadow-2xl`}
                    aria-label="Open influencers page"
                  >
                    <div className="relative aspect-[9/13] overflow-hidden bg-neutral-950">
                      <Image
                        src={frame.image}
                        alt={frame.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 72vw, 320px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                      <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                        <span className="border border-white/20 bg-black/50 px-3 py-2 text-[10px] font-black tracking-[0.25em]">
                          {frame.label}
                        </span>
                        <Instagram className="h-5 w-5 transition-transform group-hover:scale-125 group-hover:text-lime-200" />
                      </div>
                      <p className="absolute bottom-4 left-4 text-3xl font-black">{frame.metric}</p>
                      <span className="absolute bottom-5 right-4 text-[10px] font-black tracking-[0.28em] text-lime-200 opacity-0 transition-opacity group-hover:opacity-100">
                        OPEN
                      </span>
                    </div>
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="instagram-grid absolute inset-0 opacity-35" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.38em] text-lime-200/80">WHY FOLLOW</p>
                <h2 className="mt-3 text-4xl font-black sm:text-6xl">THE FEED HAS MOVEMENT</h2>
              </div>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-sm font-black text-white hover:text-lime-200"
              >
                Open Instagram
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {contentSignals.map((item, index) => {
                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="signal-info-card group relative overflow-hidden border border-white/12 bg-white/[0.035] p-6"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="mb-12 flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center border border-lime-200/30 bg-lime-200 text-black">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-black tracking-[0.35em] text-white/35">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/60">{item.copy}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/10 py-16 sm:py-24">
          <div className="instagram-grid absolute inset-0 opacity-35" />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-xs font-bold tracking-[0.38em] text-lime-200/80">
                LIVE INSTAGRAM FEED
              </p>
              <h2 className="mt-3 text-4xl font-black leading-none sm:text-6xl">
                REELS FROM THE SOURCE
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-6 text-white/60 sm:text-base">
                This block loads the official Instagram embed for @{instagramHandle}. If Instagram blocks preview in your browser, the button still opens the live page directly.
              </p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center justify-center gap-3 bg-lime-200 px-7 py-4 text-sm font-black text-black hover:bg-white"
              >
                Open Live Feed
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="signal-info-card relative overflow-hidden border border-white/12 bg-white/[0.035] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-[10px] font-black tracking-[0.32em] text-white/45">
                  @{instagramHandle}
                </p>
                <Instagram className="h-5 w-5 text-lime-200" />
              </div>

              <blockquote
                className="instagram-media"
                data-instgrm-permalink={`https://www.instagram.com/${instagramHandle}/`}
                data-instgrm-version="14"
                style={{
                  background: "#0a0a0a",
                  border: 0,
                  borderRadius: 0,
                  boxShadow: "none",
                  margin: "0 auto",
                  maxWidth: "540px",
                  minWidth: "300px",
                  padding: 0,
                  width: "100%",
                }}
              >
                <div style={{ padding: "18px", textAlign: "center" }}>
                  <Instagram className="mx-auto h-12 w-12 text-neutral-400" />
                  <p style={{ marginTop: "16px", color: "#ffffff", fontWeight: 800 }}>
                    View @{instagramHandle} on Instagram
                  </p>
                  <p style={{ marginTop: "8px", color: "#8a8a8a", fontSize: "14px" }}>
                    Reels, drops, and creator fits load here through Instagram.
                  </p>
                </div>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/10 py-16 sm:py-24">
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.38em] text-white/45">TAG THE FIT</p>
            <h2 className="mt-4 text-4xl font-black sm:text-7xl">GET SEEN BY THE STREETS</h2>
            <p className="mx-auto mt-5 max-w-2xl text-white/60">
              Tag @{instagramHandle} in your PADDLER fit. The strongest looks move from your feed to our page.
            </p>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-3 bg-white px-8 py-4 text-sm font-black text-black hover:bg-lime-200"
            >
              Go To Instagram
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={processInstagramEmbed}
      />

      <Footer />
    </>
  )
}
