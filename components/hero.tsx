"use client"

import { useEffect, useState } from "react"
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

const mobileFallback = "/images/hero/hero-mobile.webp"

type HomepageContent = {
  heroSlides?: string[]
}

export function Hero() {
  const [slides, setSlides] = useState(fallbackSlides)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "homepage"))

        if (!snap.exists()) return

        const content = snap.data() as HomepageContent
        const uploadedSlides = Array.isArray(content.heroSlides)
          ? content.heroSlides.filter(Boolean).slice(0, 3)
          : []

        if (uploadedSlides.length > 0) {
          setSlides(uploadedSlides)
        }
      } catch (error) {
        console.error("HERO SLIDES FETCH ERROR:", error)
      }
    }

    fetchHeroSlides()
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [slides.length])

  useEffect(() => {
    if (activeSlide >= slides.length) {
      setActiveSlide(0)
    }
  }, [activeSlide, slides.length])

  return (
    <section className="relative min-h-screen overflow-hidden flex items-end">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 flex transition-transform duration-1000 ease-in-out"
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
                src={slide || mobileFallback}
                alt={`THE PADDLER Hero banner ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/45 sm:bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/25 to-transparent" />
      </div>

      

      {/* Bottom Gradient Blur */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

      {/* Main Content */}
      <div className="relative z-20 w-full pb-12 sm:pb-24 lg:pb-32 pt-28 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            {/* Mini Text */}
            <p className="text-xs sm:text-sm tracking-[0.45em] text-muted-foreground mb-6 animate-pulse">
              THE PADDLER STREETWEAR
            </p>

            {/* Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95] sm:leading-[0.9] text-white">
              NOT JUST
              <br />
              CLOTHING.
              <br />
              <span className="text-white/70">
                A STATEMENT.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Built for those who move different. Premium oversized streetwear
              inspired by rebellion, underground culture, and individuality.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-8 sm:mt-10">

              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-sm font-black tracking-wide hover:scale-105 transition-all duration-300"
              >
                SHOP THE DROP
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

            </div>

            {/* Bottom Stats */}
            <div className="flex flex-wrap items-center gap-7 sm:gap-10 mt-10 sm:mt-14">

              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  240 GSM
                </p>

                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  HEAVYWEIGHT COTTON
                </p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  LIMITED
                </p>

                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  SMALL BATCH DROPS
                </p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  PREMIUM
                </p>

                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  STREETWEAR FIT
                </p>
              </div>

            </div>

            <div className="mt-8 flex gap-2">
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

          </div>

        </div>
      </div>

    </section>
  )
}
