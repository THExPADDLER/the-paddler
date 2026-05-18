"use client"

import { useEffect, useState } from "react"
import { Clock, ImageIcon, Megaphone, Save } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { db } from "@/lib/firebase"

export default function AdminBannerPage() {
  const [saving, setSaving] = useState(false)
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

  const saveContent = async (section: string) => {
    setSaving(true)

    try {
      await setDoc(
        doc(db, "siteContent", "homepage"),
        {
          ...form,
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

                  <input
                    placeholder="Hero image URL / upload later"
                    className="w-full bg-background border border-border px-4 py-4 outline-none text-white"
                    value={form.heroImage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroImage: event.target.value,
                      }))
                    }
                  />

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
