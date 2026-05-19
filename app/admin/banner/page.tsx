"use client"

import { useEffect, useState } from "react"
import { Clock, ImageIcon, ImagePlus, Megaphone, Save, X } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db, storage } from "@/lib/firebase"

export default function AdminBannerPage() {
  const [saving, setSaving] = useState(false)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState("")
  const [form, setForm] = useState({
    topBanner:
      "NEW DROP LIVE • SECURE ONLINE PAYMENTS • FREE SHIPPING ABOVE ₹1500",
    heroHeadline: "",
    heroSubheading: "",
    heroImage: "",
    countdownAt: "",
    countdownTitle: "",
  })

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "homepage"))

        if (snap.exists()) {
          setForm((current) => ({ ...current, ...snap.data() }))
        }
      } catch (error) {
        console.error("BANNER CONTENT FETCH ERROR:", error)
      }
    }

    fetchContent()
  }, [])

  const handleHeroImageSelect = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Hero image must be smaller than 8MB.")
      return
    }

    if (heroImagePreview) {
      URL.revokeObjectURL(heroImagePreview)
    }

    setHeroImageFile(file)
    setHeroImagePreview(URL.createObjectURL(file))
  }

  const clearHeroImage = () => {
    if (heroImagePreview) {
      URL.revokeObjectURL(heroImagePreview)
    }

    setHeroImageFile(null)
    setHeroImagePreview("")
    setForm((current) => ({
      ...current,
      heroImage: "",
    }))
  }

  const saveContent = async (section: string) => {
    setSaving(true)

    try {
      let heroImage = form.heroImage

      if (section === "Hero" && heroImageFile) {
        const extension =
          heroImageFile.name.split(".").pop()?.toLowerCase() || "jpg"
        const imageRef = ref(
          storage,
          `homepage/hero-${Date.now()}.${extension}`
        )

        await uploadBytes(imageRef, heroImageFile, {
          contentType: heroImageFile.type,
        })

        heroImage = await getDownloadURL(imageRef)
        setHeroImageFile(null)
        setHeroImagePreview("")
        setForm((current) => ({
          ...current,
          heroImage,
        }))
      }

      await setDoc(
        doc(db, "siteContent", "homepage"),
        {
          ...form,
          heroImage,
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
                  placeholder="NEW DROP LIVE • SECURE ONLINE PAYMENTS"
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
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6">
                  <ImageIcon className="w-5 h-5" />
                  HERO SECTION
                </h2>

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

                  <div className="border border-border bg-background p-5">
                    <p className="text-xs tracking-[0.3em] text-muted-foreground mb-4">
                      HERO IMAGE
                    </p>

                    {heroImagePreview || form.heroImage ? (
                      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900 border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={heroImagePreview || form.heroImage}
                            alt="Hero preview"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Image selected. Upload another file if you want to replace it before saving.
                          </p>

                          <div className="flex flex-wrap gap-3">
                            <label className="cursor-pointer border border-border px-5 py-3 text-sm font-black hover:bg-secondary">
                              CHANGE IMAGE
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  handleHeroImageSelect(event.target.files?.[0] || null)
                                }
                              />
                            </label>

                            <button
                              type="button"
                              onClick={clearHeroImage}
                              className="border border-border px-5 py-3 text-sm font-black text-red-400 hover:bg-secondary flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-secondary/20 px-5 py-8 text-center hover:bg-secondary/40">
                        <ImagePlus className="mb-4 h-10 w-10 text-muted-foreground" />
                        <span className="text-sm font-black text-foreground">
                          UPLOAD HERO IMAGE
                        </span>
                        <span className="mt-2 text-sm text-muted-foreground">
                          Use a wide JPG, PNG or WebP under 8MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            handleHeroImageSelect(event.target.files?.[0] || null)
                          }
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => saveContent("Hero")}
                    disabled={saving}
                    className="bg-foreground text-background px-6 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    SAVE HERO
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
