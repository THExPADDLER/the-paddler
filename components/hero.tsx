"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

const fallbackSlides = [
  "/images/hero/hero-desktop.webp",
  "/images/hero/hero-desktop.webp",
  "/images/hero/hero-desktop.webp",
]

const fallbackMobileSlides = [
  "/images/hero/hero-mobile.webp",
  "/images/hero/hero-mobile.webp",
  "/images/hero/hero-mobile.webp",
]

const defaultHeroEyebrow = "THE PADDLER STREETWEAR"
const defaultHeroHeadline = "NOT JUST\nCLOTHING.\nA STATEMENT."
const defaultHeroSubheading =
  "Built for those who move different. Premium oversized streetwear inspired by rebellion, underground culture, and individuality."

type HomepageContent = {
  heroEyebrow?: string
  heroHeadline?: string
  heroSubheading?: string
  heroImage?: string
  heroSlides?: string[]
  heroMobileSlides?: string[]
  countdownAt?: string
  countdownTitle?: string
}

const getTimeLeft = (target?: string) => {
  if (!target) return null

  const endAt = new Date(target).getTime()
  const distance = endAt - Date.now()

  if (!Number.isFinite(endAt) || distance <= 0) return null

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((distance / (1000 * 60)) % 60)
  const seconds = Math.floor((distance / 1000) % 60)

  return { days, hours, minutes, seconds }
}

export function Hero() {
  const [slides, setSlides] = useState(fallbackSlides)
  const [mobileSlides, setMobileSlides] = useState(fallbackMobileSlides)
  const [activeSlide, setActiveSlide] = useState(0)
  const [heroEyebrow, setHeroEyebrow] = useState(defaultHeroEyebrow)
  const [heroHeadline, setHeroHeadline] = useState(defaultHeroHeadline)
  const [heroSubheading, setHeroSubheading] = useState(defaultHeroSubheading)
  const [countdownAt, setCountdownAt] = useState("")
  const [countdownTitle, setCountdownTitle] = useState("")
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "homepage"))

        if (!snap.exists()) return

        const content = snap.data() as HomepageContent
        const uploadedSlides = Array.isArray(content.heroSlides)
          ? content.heroSlides.filter(Boolean).slice(0, 3)
          : []
        const uploadedMobileSlides = Array.isArray(content.heroMobileSlides)
          ? content.heroMobileSlides.filter(Boolean).slice(0, 3)
          : []
        const legacyHeroImage =
          typeof content.heroImage === "string" && content.heroImage.trim()
            ? content.heroImage
            : ""

        if (uploadedSlides.length > 0) {
          setSlides(uploadedSlides)
        } else if (legacyHeroImage) {
          setSlides([legacyHeroImage])
        }

        if (uploadedMobileSlides.length > 0) {
          setMobileSlides(uploadedMobileSlides)
        } else if (uploadedSlides.length > 0) {
          setMobileSlides(uploadedSlides)
        } else if (legacyHeroImage) {
          setMobileSlides([legacyHeroImage])
        }

        setHeroEyebrow(content.heroEyebrow || defaultHeroEyebrow)
        setHeroHeadline(content.heroHeadline || defaultHeroHeadline)
        setHeroSubheading(content.heroSubheading || defaultHeroSubheading)
        setCountdownAt(content.countdownAt || "")
        setCountdownTitle(content.countdownTitle || "")
      } catch (error) {
        console.error("HERO CONTENT FETCH ERROR:", error)
      }
    }

    fetchHeroContent()
  }, [])

  useEffect(() => {
    const maxSlides = Math.max(slides.length, mobileSlides.length)
    if (maxSlides <= 1) return

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % maxSlides)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [slides.length, mobileSlides.length])

  useEffect(() => {
    const maxSlides = Math.max(slides.length, mobileSlides.length)
    if (activeSlide >= maxSlides) {
      setActiveSlide(0)
    }
  }, [activeSlide, slides.length, mobileSlides.length])

  useEffect(() => {
    if (!countdownAt) return

    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [countdownAt])

  const timeLeft = useMemo(() => {
    void now
    return getTimeLeft(countdownAt)
  }, [countdownAt, now])

  const headlineLines = heroHeadline
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <section className="relative min-h-screen overflow-hidden flex items-end">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 hidden transition-transform duration-1000 ease-in-out sm:flex"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${activeSlide * (100 / slides.length)}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={`${slide}-${index}`}
              className="relative h-full shrink-0"
              style={{ width: `${100 / slides.length}%` }}
            >
              <Image
                src={slide}
                alt={`THE PADDLER hero banner ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="hero-image-motion object-cover object-center"
              />
            </div>
          ))}
        </div>

        <div
          className="absolute inset-0 flex transition-transform duration-1000 ease-in-out sm:hidden"
          style={{
            width: `${mobileSlides.length * 100}%`,
            transform: `translateX(-${
              (activeSlide % mobileSlides.length) * (100 / mobileSlides.length)
            }%)`,
          }}
        >
          {mobileSlides.map((slide, index) => (
            <div
              key={`mobile-${slide}-${index}`}
              className="relative h-full shrink-0"
              style={{ width: `${100 / mobileSlides.length}%` }}
            >
              <Image
                src={slide}
                alt={`THE PADDLER mobile hero banner ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="hero-image-motion object-cover object-center"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-black/50 sm:bg-black/38" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.13),transparent_26%),radial-gradient(circle_at_82%_34%,rgba(255,255,255,0.08),transparent_24%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/25 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

      <div className="relative z-20 w-full pb-10 sm:pb-20 lg:pb-28 pt-24 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="hero-reveal inline-flex max-w-full items-center border border-white/20 bg-black/35 px-3 py-2 text-[10px] sm:text-xs tracking-[0.24em] sm:tracking-[0.34em] text-white/80 mb-5 backdrop-blur">
              {heroEyebrow}
            </p>

            <h1 className="hero-reveal hero-reveal-delay-1 max-w-[11ch] text-[2.35rem] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-normal leading-[0.96] sm:leading-[0.92] text-white">
              {headlineLines.map((line, index) => (
                <span
                  key={`${line}-${index}`}
                  className={index === headlineLines.length - 1 ? "text-white/70" : ""}
                >
                  {line}
                  {index < headlineLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="hero-reveal hero-reveal-delay-2 mt-5 sm:mt-7 text-sm sm:text-base lg:text-lg text-white/72 max-w-xl leading-relaxed">
              {heroSubheading}
            </p>

            <div className="hero-reveal hero-reveal-delay-3 flex flex-wrap items-center gap-4 mt-7 sm:mt-9">
              <Link
                href="/shop"
                className="hero-cta group inline-flex items-center gap-2 bg-white text-black px-7 sm:px-8 py-4 text-sm font-black tracking-wide transition-all duration-300"
              >
                SHOP THE DROP
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {timeLeft && (
              <div className="hero-reveal hero-reveal-delay-4 mt-8 border border-white/20 bg-black/45 p-4 sm:p-5 backdrop-blur max-w-xl">
                <p className="text-xs tracking-[0.3em] text-muted-foreground mb-4">
                  {countdownTitle || "NEXT DROP COUNTDOWN"}
                </p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    ["DAYS", timeLeft.days],
                    ["HRS", timeLeft.hours],
                    ["MIN", timeLeft.minutes],
                    ["SEC", timeLeft.seconds],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-white/15 py-3">
                      <p className="text-2xl sm:text-3xl font-black text-white">
                        {String(value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[10px] tracking-[0.25em] text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="hero-reveal hero-reveal-delay-4 flex flex-wrap items-center gap-5 sm:gap-8 mt-9 sm:mt-12">
              <div className="hero-stat">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  240 GSM
                </p>
                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  HEAVYWEIGHT COTTON
                </p>
              </div>

              <div className="hero-stat">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  LIMITED
                </p>
                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  SMALL BATCH DROPS
                </p>
              </div>

              <div className="hero-stat">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  PREMIUM
                </p>
                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  STREETWEAR FIT
                </p>
              </div>
            </div>

            {slides.length > 1 && (
              <div className="hero-reveal hero-reveal-delay-4 mt-8 flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Show banner ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1.5 transition-all ${
                      index === activeSlide
                        ? "w-10 bg-white"
                        : "w-5 bg-white/35 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
