"use client"

import { useState } from "react"
import Image from "next/image"
import { Bell } from "lucide-react"
import { addDoc, collection } from "firebase/firestore"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { db } from "@/lib/firebase"

const archiveDrops = [
  {
    slug: "void-drop-01",
    title: "VOID DROP 01",
    date: "SPRING 2026",
    image: "/images/products/black-tee-2.jpg",
    status: "SOLD OUT",
  },
  {
    slug: "skull-series",
    title: "SKULL SERIES",
    date: "LIMITED RELEASE",
    image: "/images/products/black-tee-3.jpg",
    status: "ARCHIVED",
  },
  {
    slug: "forest-vintage",
    title: "FOREST VINTAGE",
    date: "GREEN DROP",
    image: "/images/products/green-tee-1.jpg",
    status: "SOLD OUT",
  },
]

export default function ArchivePage() {
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  const handleNotify = async (drop: (typeof archiveDrops)[number]) => {
    const email = emails[drop.slug]?.trim()

    if (!email) {
      alert("Please enter your email.")
      return
    }

    try {
      setSavingSlug(drop.slug)

      await addDoc(collection(db, "notifyRequests"), {
        productSlug: drop.slug,
        productName: drop.title,
        email,
        source: "archive",
        status: "open",
        createdAt: new Date().toISOString(),
      })

      setEmails((current) => ({ ...current, [drop.slug]: "" }))
      alert("Done! We will notify you if this archive piece returns.")
    } catch (error) {
      console.error("ARCHIVE NOTIFY ERROR:", error)
      alert("Unable to save notify request. Please try again.")
    } finally {
      setSavingSlug(null)
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            PAST DROPS
          </p>

          <h1 className="text-4xl sm:text-5xl font-black mb-6">ARCHIVE</h1>

          <p className="text-muted-foreground max-w-2xl mb-14">
            Previous drops, sold-out pieces, and limited releases from THE PADDLER.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {archiveDrops.map((drop) => (
              <div key={drop.title} className="border border-border bg-secondary/20">
                <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
                  <Image
                    src={drop.image}
                    alt={drop.title}
                    fill
                    className="object-cover opacity-70"
                  />

                  <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-xs font-black">
                    {drop.status}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs tracking-[0.25em] text-muted-foreground mb-2">
                    {drop.date}
                  </p>

                  <h2 className="text-xl font-black">{drop.title}</h2>

                  <div className="mt-5 border-t border-border pt-5">
                    <p className="font-black mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      NOTIFY ME
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter email"
                        className="min-w-0 flex-1 bg-background border border-border px-4 py-3 outline-none focus:border-foreground text-white"
                        value={emails[drop.slug] || ""}
                        onChange={(event) =>
                          setEmails((current) => ({
                            ...current,
                            [drop.slug]: event.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        onClick={() => handleNotify(drop)}
                        disabled={savingSlug === drop.slug}
                        className="bg-foreground text-background px-4 py-3 text-sm font-black disabled:opacity-60"
                      >
                        {savingSlug === drop.slug ? "..." : "SAVE"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
