"use client"

import { useEffect, useState } from "react"
import { Clock, ImageIcon, ImagePlus, Save, Type, X } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { db, storage } from "@/lib/firebase"

type HomepageForm = {
  heroEyebrow: string
  heroHeadline: string
  heroSubheading: string
  heroImage: string
  heroSlides: string[]
  heroMobileSlides: string[]
  countdownAt: string
  countdownTitle: string
}

const emptySlides = ["", "", ""]

const toDatetimeLocal = (value?: string) => {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

const fromDatetimeLocal = (value: string) => {
  if (!value) return ""

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

export default function AdminBannerPage() {
  const [saving, setSaving] = useState(false)
  const [heroSlideFiles, setHeroSlideFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
  ])
  const [heroSlidePreviews, setHeroSlidePreviews] = useState(emptySlides)
  const [heroMobileSlideFiles, setHeroMobileSlideFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
  ])
  const [heroMobileSlidePreviews, setHeroMobileSlidePreviews] = useState(emptySlides)
  const [form, setForm] = useState<HomepageForm>({
    heroEyebrow: "THE PADDLER STREETWEAR",
    heroHeadline: "NOT JUST\nCLOTHING.\nA STATEMENT.",
    heroSubheading:
      "Built for those who move different. Premium oversized streetwear inspired by rebellion, underground culture, and individuality.",
    heroImage: "",
    heroSlides: [],
    heroMobileSlides: [],
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
              ? [...emptySlides].map((_, index) => data.heroSlides?.[index] || "")
              : data.heroImage
                ? [data.heroImage, "", ""]
                : [],
            heroMobileSlides: Array.isArray(data.heroMobileSlides)
              ? [...emptySlides].map((_, index) => data.heroMobileSlides?.[index] || "")
              : [],
            countdownAt: toDatetimeLocal(data.countdownAt),
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
      heroMobileSlidePreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview)
      })
    }
  }, [heroSlidePreviews, heroMobileSlidePreviews])

  const handleHeroImageSelect = (
    slot: number,
    file: File | null,
    target: "desktop" | "mobile" = "desktop"
  ) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Hero image must be smaller than 8MB.")
      return
    }

    const previews =
      target === "desktop" ? heroSlidePreviews : heroMobileSlidePreviews

    if (previews[slot]) {
      URL.revokeObjectURL(previews[slot])
    }

    const setFiles =
      target === "desktop" ? setHeroSlideFiles : setHeroMobileSlideFiles
    const setPreviews =
      target === "desktop" ? setHeroSlidePreviews : setHeroMobileSlidePreviews

    setFiles((current) =>
      current.map((item, index) => (index === slot ? file : item))
    )
    setPreviews((current) =>
      current.map((item, index) =>
        index === slot ? URL.createObjectURL(file) : item
      )
    )
  }

  const clearHeroImage = (
    slot: number,
    target: "desktop" | "mobile" = "desktop"
  ) => {
    const previews =
      target === "desktop" ? heroSlidePreviews : heroMobileSlidePreviews

    if (previews[slot]) {
      URL.revokeObjectURL(previews[slot])
    }

    const setFiles =
      target === "desktop" ? setHeroSlideFiles : setHeroMobileSlideFiles
    const setPreviews =
      target === "desktop" ? setHeroSlidePreviews : setHeroMobileSlidePreviews
    const field = target === "desktop" ? "heroSlides" : "heroMobileSlides"

    setFiles((current) =>
      current.map((item, index) => (index === slot ? null : item))
    )
    setPreviews((current) =>
      current.map((item, index) => (index === slot ? "" : item))
    )
    setForm((current) => ({
      ...current,
      heroImage: target === "desktop" && slot === 0 ? "" : current.heroImage,
      [field]: [...emptySlides].map((_, index) =>
        index === slot ? "" : current[field][index] || ""
      ),
    }))
  }

  const uploadHeroSlides = async (target: "desktop" | "mobile") => {
    const files = target === "desktop" ? heroSlideFiles : heroMobileSlideFiles
    const sourceSlides =
      target === "desktop" ? form.heroSlides : form.heroMobileSlides
    const folder =
      target === "desktop" ? "hero-slide" : "hero-mobile-slide"

    const heroSlides = [...emptySlides].map(
      (_, index) => sourceSlides[index] || ""
    )

    for (const [index, file] of files.entries()) {
      if (!file) continue

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const imageRef = ref(
        storage,
        `homepage/${folder}-${index + 1}-${Date.now()}.${extension}`
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
      let heroSlides = [...emptySlides].map(
        (_, index) => form.heroSlides[index] || ""
      )
      let heroMobileSlides = [...emptySlides].map(
        (_, index) => form.heroMobileSlides[index] || ""
      )
      let heroImage = form.heroImage

      if (section === "Hero") {
        heroSlides = await uploadHeroSlides("desktop")
        heroMobileSlides = await uploadHeroSlides("mobile")
        heroImage = heroSlides.find(Boolean) || heroImage

        heroSlidePreviews.forEach((preview) => {
          if (preview) URL.revokeObjectURL(preview)
        })
        heroMobileSlidePreviews.forEach((preview) => {
          if (preview) URL.revokeObjectURL(preview)
        })
        setHeroSlideFiles([null, null, null])
        setHeroSlidePreviews(emptySlides)
        setHeroMobileSlideFiles([null, null, null])
        setHeroMobileSlidePreviews(emptySlides)
      }

      const payload = {
        ...form,
        heroImage,
        heroSlides,
        heroMobileSlides,
        countdownAt: fromDatetimeLocal(form.countdownAt),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "siteContent", "homepage"), payload, {
        merge: true,
      })

      setForm((current) => ({
        ...current,
        heroImage,
        heroSlides,
        heroMobileSlides,
        countdownAt: toDatetimeLocal(payload.countdownAt),
      }))

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

  const currentMobileSlideImage = (slot: number) =>
    heroMobileSlidePreviews[slot] || form.heroMobileSlides[slot] || ""

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
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
                <h2 className="text-2xl font-black flex items-center gap-2 mb-2">
                  <Type className="w-5 h-5" />
                  HERO TEXT EDITOR
                </h2>

                <p className="mb-6 text-sm text-muted-foreground">
                  Edit the main landing screen text shown over the hero banner.
                </p>

                <div className="grid gap-5">
                  <input
                    placeholder="Small top text"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={form.heroEyebrow}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroEyebrow: event.target.value,
                      }))
                    }
                  />

                  <textarea
                    placeholder="Hero headline"
                    className="w-full min-h-36 bg-background border border-border px-4 py-4 outline-none text-white resize-y"
                    value={form.heroHeadline}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroHeadline: event.target.value,
                      }))
                    }
                  />

                  <textarea
                    placeholder="Hero subheading"
                    className="w-full min-h-28 bg-background border border-border px-4 py-4 outline-none text-white resize-y"
                    value={form.heroSubheading}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroSubheading: event.target.value,
                      }))
                    }
                  />
                </div>
              </section>

              <section className="border border-border bg-secondary/20 p-6 sm:p-8">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5" />
                  HERO SLIDER
                </h2>

                <p className="mb-6 text-sm text-muted-foreground">
                  Upload separate desktop and mobile homepage banners. Both slide
                  from right to left every 5 seconds.
                </p>

                <p className="mb-4 text-xs font-black tracking-[0.3em] text-muted-foreground">
                  PC / DESKTOP BANNERS
                </p>

                <div className="grid gap-5 lg:grid-cols-3">
                  {[0, 1, 2].map((slot) => {
                    const image = currentSlideImage(slot)

                    return (
                      <div key={slot} className="border border-border bg-background p-4">
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

                <p className="mb-4 mt-8 text-xs font-black tracking-[0.3em] text-muted-foreground">
                  MOBILE BANNERS
                </p>

                <div className="grid gap-5 lg:grid-cols-3">
                  {[0, 1, 2].map((slot) => {
                    const image = currentMobileSlideImage(slot)

                    return (
                      <div key={`mobile-${slot}`} className="border border-border bg-background p-4">
                        <p className="text-xs tracking-[0.25em] text-muted-foreground mb-4">
                          MOBILE {slot + 1}
                        </p>

                        {image ? (
                          <div className="space-y-4">
                            <div className="relative aspect-[9/16] overflow-hidden bg-neutral-900 border border-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image}
                                alt={`Mobile hero banner ${slot + 1}`}
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
                                      event.target.files?.[0] || null,
                                      "mobile"
                                    )
                                  }
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => clearHeroImage(slot, "mobile")}
                                className="border border-border px-4 py-3 text-xs font-black text-red-400 hover:bg-secondary flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                REMOVE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-secondary/20 px-4 py-8 text-center hover:bg-secondary/40">
                            <ImagePlus className="mb-4 h-9 w-9 text-muted-foreground" />
                            <span className="text-sm font-black text-foreground">
                              UPLOAD MOBILE IMAGE
                            </span>
                            <span className="mt-2 text-xs text-muted-foreground">
                              Recommended 9:16, JPG/PNG/WebP under 8MB
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleHeroImageSelect(
                                  slot,
                                  event.target.files?.[0] || null,
                                  "mobile"
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
                  className="mt-5 bg-foreground text-background px-6 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  SAVE HERO TEXT & SLIDER
                </button>
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
