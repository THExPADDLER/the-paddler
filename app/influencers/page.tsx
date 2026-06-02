"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Camera, Instagram, Sparkles, Ticket } from "lucide-react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { db } from "@/lib/firebase"

type Influencer = {
  id: string
  name: string
  username: string
  image: string
  followers: string
  bio?: string
  instagramUrl?: string
  active?: boolean
}

const fallbackInfluencers: Influencer[] = [
  {
    id: "anaya",
    name: "ANAYA",
    username: "@anaya.jpg",
    image: "/images/influencers/anaya.jpg",
    followers: "48K",
    active: true,
  },
  {
    id: "lucifer",
    name: "LUCIFER",
    username: "@ig.lucifer.__",
    image: "/images/influencers/lucifer.jpg",
    followers: "22K",
    active: true,
  },
  {
    id: "zoe",
    name: "ZOE",
    username: "@zoe__thebitch",
    image: "/images/influencers/zoe.jpg",
    followers: "15K",
    active: true,
  },
]

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState(fallbackInfluencers)

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "influencers"), orderBy("createdAt", "desc"))
        )
        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Influencer, "id">),
          }))
          .filter((item) => item.active !== false)

        if (data.length > 0) {
          setInfluencers(data)
        }
      } catch (error) {
        console.error("PUBLIC INFLUENCERS FETCH ERROR:", error)
      }
    }

    fetchInfluencers()
  }, [])

  return (
    <>
      <Header />

      <main className="influencer-stage min-h-screen overflow-hidden bg-black pt-16 text-white">
        <section className="relative border-b border-white/10 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="influencer-grid absolute inset-0 opacity-70" />
          <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="mb-4 inline-flex border border-lime-200/30 bg-lime-200 px-3 py-2 text-[10px] font-black tracking-[0.35em] text-black">
                CREATOR CIRCUIT
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.88] sm:text-7xl lg:text-8xl">
                FACES THAT MOVE THE DROP
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                Creators, riders, artists, and street pages carrying THE PADDLER in the real world. Every profile is built around a shoot story, a city signal, and a real streetwear presence.
              </p>
            </div>

            <div className="influencer-control-panel border border-white/12 bg-white/[0.04] p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-white/10 p-4">
                  <Sparkles className="mb-5 h-5 w-5 text-lime-200" />
                  <p className="text-3xl font-black">{influencers.length}</p>
                  <p className="mt-1 text-[10px] tracking-[0.3em] text-white/45">LIVE CREATORS</p>
                </div>

                <div className="border border-white/10 p-4">
                  <Camera className="mb-5 h-5 w-5 text-lime-200" />
                  <p className="text-3xl font-black">SHOOTS</p>
                  <p className="mt-1 text-[10px] tracking-[0.3em] text-white/45">CREATOR FILES</p>
                </div>

                <div className="border border-white/10 p-4">
                  <Ticket className="mb-5 h-5 w-5 text-lime-200" />
                  <p className="text-3xl font-black">COLLAB</p>
                  <p className="mt-1 text-[10px] tracking-[0.3em] text-white/45">OPEN CALL</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="influencer-grid absolute inset-0 opacity-35" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {influencers.map((influencer, index) => (
                <article
                  key={influencer.id}
                  className="influencer-card group relative overflow-hidden border border-white/12 bg-white/[0.035]"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <div className="absolute left-4 top-4 z-20 border border-white/15 bg-black/70 px-3 py-2 text-[10px] font-black tracking-[0.28em] text-white/70">
                    CREATOR 0{index + 1}
                  </div>

                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
                    <Image
                      src={influencer.image || "/placeholder.svg"}
                      alt={influencer.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-[10px] font-bold tracking-[0.35em] text-lime-200/90">
                        {influencer.username || "THE PADDLER"}
                      </p>
                      <h2 className="mt-2 text-4xl font-black">{influencer.name}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-y border-white/10">
                    <div className="border-r border-white/10 p-5">
                      <p className="text-[10px] tracking-[0.3em] text-white/40">FOLLOWERS</p>
                      <p className="mt-1 text-2xl font-black">{influencer.followers || "-"}</p>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] tracking-[0.3em] text-white/40">STYLE</p>
                      <p className="mt-1 text-2xl font-black text-lime-200">FEATURED</p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="min-h-12 text-sm leading-6 text-white/60">
                      {influencer.bio || "Street energy, product shoots, campaign faces, and community drops."}
                    </p>

                    <div className="mt-6 flex gap-3">
                      {influencer.instagramUrl ? (
                        <Link
                          href={influencer.instagramUrl}
                          target="_blank"
                          className="inline-flex flex-1 items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-black text-black hover:bg-lime-200"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </Link>
                      ) : (
                        <span className="inline-flex flex-1 items-center justify-center gap-2 border border-white/12 px-4 py-3 text-sm font-black text-white/45">
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </span>
                      )}

                      <Link
                        href="/shop"
                        className="inline-flex items-center justify-center border border-white/12 px-4 py-3 text-sm font-black hover:border-white hover:bg-white hover:text-black"
                        aria-label="Shop the drop"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="influencer-apply relative mt-16 overflow-hidden border border-lime-200/25 bg-lime-200 p-7 text-black sm:p-10">
              <p className="text-xs font-black tracking-[0.35em] text-black/55">COLLAB DESK</p>
              <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <h2 className="text-4xl font-black sm:text-6xl">WANT YOUR FACE ON THE DROP?</h2>
                  <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-black/65">
                    We work with creators who can make product feel alive. Send your page, city, and shoot style.
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 bg-black px-7 py-4 text-sm font-black text-white hover:bg-white hover:text-black"
                >
                  Apply For Collab
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
