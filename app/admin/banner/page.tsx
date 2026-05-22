"use client"

import { useEffect, useState } from "react"
import { Clock, ImageIcon, ImagePlus, Megaphone, Save, X } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db, storage } from "@/lib/firebase"

type HomepageForm = {
  topBanner: string
  heroHeadline: string
  heroSubheading: string
  heroImage: string
  heroSlides: string[]
  countdownAt: string
  countdownTitle: string
}

const emptySlides = ["", "", ""]

export default function AdminBannerPage() {
  const [saving, setSaving] = useState(false)
  const [heroSlideFiles, setHeroSlideFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
  ])
  const [heroSlidePreviews, setHeroSlidePreviews] = useState(emptySlides)
  const [form, setForm] = useState<HomepageForm>({
    topBanner: "NEW DROP LIVE - SECURE ONLINE PAYMENTS - FREE SHIPPING ABOVE RS 1500",
    heroHeadline: "",
    heroSubheading: "",
    heroImage: "",
    heroSlides: [],
    countdownAt: "",
    countdownTitle: "",
  })

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "homepage"))

        if (snap.exists()) {
          const data = snap.data() as Partial<HomepageForm>
          setForm((current) => ({
            ...current,
            ...data,
            heroSlides: Array.isArray(data.heroSlides)
              ? data.heroSlides.slice(0, 3)
              : data.heroImage
                ? [data.heroImage]
                : [],
          }))
        }
      } catch (error) {
        console.error("BANNER CONTENT FETCH ERROR:", error)
      }
    }

    fetchContent()
  }, [])

  useEffect(() => {
    return () => {
      heroSlidePreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview)
      })
    }
  }, [heroSlidePreviews])

  const handleHeroImageSelect = (slot: number, file: File | null) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Hero image must be smaller than 8MB.")
      return
    }

    if (heroSlidePreviews[slot]) {
      URL.revokeObjectURL(heroSlidePreviews[slot])
    }

    setHeroSlideFiles((current) =>
      current.map((item, index) => (index === slot ? file : item))
    )
    setHeroSlidePreviews((current) =>
      current.map((item, index) =>
        index === slot ? URL.createObjectURL(file) : item
      )
    )
  }

  const clearHeroImage = (slot: number) => {
    if (heroSlidePreviews[slot]) {
      URL.revokeObjectURL(heroSlidePreviews[slot])
    }

    setHeroSlideFiles((current) =>
      current.map((item, index) => (index === slot ? null : item))
    )
    setHeroSlidePreviews((current) =>
      current.map((item, index) => (index === slot ? "" : item))
    )
    setForm((current) => ({
      ...current,
      heroImage: slot === 0 ? "" : current.heroImage,
      heroSlides: [...emptySlides].map((_, index) =>
        index === slot ? "" : current.heroSlides[index] || ""
      ),
    }))
  }

  const uploadHeroSlides = async () => {
    const heroSlides = [...emptySlides].map((_, index) => form.heroSlides[index] || "")

    for (const [index, file] of heroSlideFiles.entries()) {
      if (!file) continue

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const imageRef = ref(
        storage,
        `homepage/hero-slide-${index + 1}-${Date.now()}.${extension}`
      )

      await uploadBytes(imageRef, file, {
        contentType: file.type,
      })

      heroSlides[index] = await getDownloadURL(imageRef)
    }

    return heroSlides
  }

  const saveContent = async (section: string) => {
    setSaving(true)

    try {
      let heroSlides = [...emptySlides].map((_, index) => form.heroSlides[index] || "")
      let heroImage = form.heroImage

      if (section === "Hero") {
        heroSlides = await uploadHeroSlides()
        heroImage = heroSlides.find(Boolean) || heroImage

        heroSlidePreviews.forEach((preview) => {
          if (preview) URL.revokeObjectURL(preview)
        })
        setHeroSlideFiles([null, null, null])
        setHeroSlidePreviews(emptySlides)
        setForm((current) => ({
          ...current,
          heroImage,
          heroSlides,
        }))
      }

      await setDoc(
        doc(db, "siteContent", "homepage"),
        {
          ...form,
          heroImage,
          heroSlides,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      alert(`${section} saved.`)
    } catch (error) {
      console.error("BANNER SAVE ERROR:", error)
      alert("Unable to save homepage content.")
    } finally {
      setSaving(false)
    }
  }

  const currentSlideImage = (slot: number) =>
    heroSlidePreviews[slot] || form.heroSlides[slot] || ""

  return (
    <ProtectedRoute adminOnly>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="max-w-5xl mx-auto px-4">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              HOMEPAGE CONTROL
            </p>

            <h1 className="text-4xl font-black mb-10">BANNER CONTROL</h1>

            <div className="space-y-8">
              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6">
                  <Megaphone className="w-5 h-5" />
                  TOP MOVING BANNER
                </h2>

                <textarea
                  placeholder="NEW DROP LIVE - SECURE ONLINE PAYMENTS"
                  className="w-full min-h-28 bg-background border border-border px-4 py-4 outline-none text-white resize-none"
                  value={form.topBanner}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      topBanner: event.target.value,
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={() => saveContent("Top banner")}
                  disabled={saving}
                  className="mt-5 bg-foreground text-background px-6 py-3 font-black flex items-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  SAVE BANNER
                </button>
              </section>

              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5" />
                  HERO SLIDER
                </h2>

                <p className="mb-6 text-sm text-muted-foreground">
                  Upload 3 homepage banner images. The landing page slides from
                  right to left every 5 seconds.
                </p>

                <div className="grid gap-5">
                  <input
                    placeholder="Hero headline"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={form.heroHeadline}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroHeadline: event.target.value,
                      }))
                    }
                  />

                  <input
                    placeholder="Hero subheading"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={form.heroSubheading}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroSubheading: event.target.value,
                      }))
                    }
                  />

                  <div className="grid gap-5 lg:grid-cols-3">
                    {[0, 1, 2].map((slot) => {
                      const image = currentSlideImage(slot)

                      return (
                        <div
                          key={slot}
                          className="border border-border bg-background p-4"
                        >
                          <p className="text-xs tracking-[0.25em] text-muted-foreground mb-4">
                            BANNER {slot + 1}
                          </p>

                          {image ? (
                            <div className="space-y-4">
                              <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900 border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image}
                                  alt={`Hero banner ${slot + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <label className="cursor-pointer border border-border px-4 py-3 text-xs font-black hover:bg-secondary">
                                  CHANGE
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) =>
                                      handleHeroImageSelect(
                                        slot,
                                        event.target.files?.[0] || null
                                      )
                                    }
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={() => clearHeroImage(slot)}
                                  className="border border-border px-4 py-3 text-xs font-black text-red-400 hover:bg-secondary flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  REMOVE
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-secondary/20 px-4 py-8 text-center hover:bg-secondary/40">
                              <ImagePlus className="mb-4 h-9 w-9 text-muted-foreground" />
                              <span className="text-sm font-black text-foreground">
                                UPLOAD IMAGE
                              </span>
                              <span className="mt-2 text-xs text-muted-foreground">
                                JPG, PNG or WebP under 8MB
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  handleHeroImageSelect(
                                    slot,
                                    event.target.files?.[0] || null
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => saveContent("Hero")}
                    disabled={saving}
                    className="bg-foreground text-background px-6 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    SAVE HERO SLIDER
                  </button>
                </div>
              </section>

              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5" />
                  DROP COUNTDOWN
                </h2>

                <div className="grid sm:grid-cols-2 gap-5">
                  <input
                    type="datetime-local"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={form.countdownAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        countdownAt: event.target.value,
                      }))
                    }
                  />

                  <input
                    placeholder="Drop title"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={form.countdownTitle}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        countdownTitle: event.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => saveContent("Countdown")}
                  disabled={saving}
                  className="mt-5 bg-foreground text-background px-6 py-3 font-black flex items-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  SAVE COUNTDOWN
                </button>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
