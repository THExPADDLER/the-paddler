"use client"

import { useEffect, useState } from "react"
import { ImagePlus, Save, Trash2, UserRound, X } from "lucide-react"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { db, storage } from "@/lib/firebase"

type Influencer = {
  id: string
  name: string
  username: string
  followers: string
  couponCode: string
  bio: string
  instagramUrl: string
  image: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

const emptyInfluencer: Omit<Influencer, "id"> = {
  name: "",
  username: "",
  followers: "",
  couponCode: "",
  bio: "",
  instagramUrl: "",
  image: "",
  active: true,
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

export default function AdminInfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [form, setForm] = useState(emptyInfluencer)
  const [editingId, setEditingId] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchInfluencers = async () => {
    try {
      setLoading(true)
      const snapshot = await getDocs(
        query(collection(db, "influencers"), orderBy("createdAt", "desc"))
      )
      setInfluencers(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Influencer, "id">),
        }))
      )
    } catch (error) {
      console.error("ADMIN INFLUENCERS FETCH ERROR:", error)
      setInfluencers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfluencers()
  }, [])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const resetForm = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setForm(emptyInfluencer)
    setEditingId("")
    setImageFile(null)
    setImagePreview("")
  }

  const selectImage = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Image must be smaller than 8MB.")
      return
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const editInfluencer = (influencer: Influencer) => {
    resetForm()
    setEditingId(influencer.id)
    setForm({
      name: influencer.name || "",
      username: influencer.username || "",
      followers: influencer.followers || "",
      couponCode: influencer.couponCode || "",
      bio: influencer.bio || "",
      instagramUrl: influencer.instagramUrl || "",
      image: influencer.image || "",
      active: influencer.active !== false,
    })
  }

  const uploadImage = async (id: string) => {
    if (!imageFile) return form.image

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
    const imageRef = ref(storage, `influencers/${id}-${Date.now()}.${extension}`)
    await uploadBytes(imageRef, imageFile, {
      contentType: imageFile.type,
    })
    return getDownloadURL(imageRef)
  }

  const saveInfluencer = async (event: React.FormEvent) => {
    event.preventDefault()

    const id = editingId || slugify(form.name || form.username)

    if (!id || !form.name.trim()) {
      alert("Influencer name is required.")
      return
    }

    setSaving(true)

    try {
      const image = await uploadImage(id)
      await setDoc(
        doc(db, "influencers", id),
        {
          ...form,
          name: form.name.trim(),
          username: form.username.trim(),
          couponCode: form.couponCode.trim().toUpperCase(),
          image,
          createdAt:
            influencers.find((item) => item.id === id)?.createdAt ||
            new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      resetForm()
      await fetchInfluencers()
      alert("Influencer saved.")
    } catch (error) {
      console.error("ADMIN INFLUENCER SAVE ERROR:", error)
      alert("Unable to save influencer.")
    } finally {
      setSaving(false)
    }
  }

  const deleteInfluencer = async (influencer: Influencer) => {
    const confirmed = window.confirm(`Delete ${influencer.name}?`)
    if (!confirmed) return

    await deleteDoc(doc(db, "influencers", influencer.id))
    await fetchInfluencers()
  }

  const image = imagePreview || form.image

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Header />

        <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <p className="mb-3 text-xs tracking-[0.35em] text-muted-foreground">
              INFLUENCER SHOWCASE CONTROL
            </p>
            <h1 className="mb-10 text-4xl font-black">EDIT INFLUENCERS</h1>

            <form
              onSubmit={saveInfluencer}
              className="mb-12 grid gap-6 border border-border bg-secondary/20 p-5 lg:grid-cols-[0.8fr_1.2fr]"
            >
              <div>
                {image ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[3/4] overflow-hidden border border-border bg-neutral-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt="Influencer shoot"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="cursor-pointer border border-border px-4 py-3 text-xs font-black hover:bg-secondary">
                        CHANGE PHOTO
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            selectImage(event.target.files?.[0] || null)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (imagePreview) URL.revokeObjectURL(imagePreview)
                          setImageFile(null)
                          setImagePreview("")
                          setForm((current) => ({ ...current, image: "" }))
                        }}
                        className="flex items-center gap-2 border border-border px-4 py-3 text-xs font-black text-red-400 hover:bg-secondary"
                      >
                        <X className="h-4 w-4" />
                        REMOVE
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex min-h-96 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-background px-4 py-8 text-center hover:bg-secondary/40">
                    <ImagePlus className="mb-4 h-10 w-10 text-muted-foreground" />
                    <span className="text-sm font-black">UPLOAD SHOOT PHOTO</span>
                    <span className="mt-2 text-xs text-muted-foreground">
                      Recommended 3:4 portrait image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        selectImage(event.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
              </div>

              <div className="grid gap-4">
                <input
                  placeholder="Influencer name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="border border-border bg-background px-4 py-4 text-white outline-none"
                />
                <input
                  placeholder="Instagram username e.g. @name"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="border border-border bg-background px-4 py-4 text-white outline-none"
                />
                <input
                  placeholder="Instagram profile URL"
                  value={form.instagramUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      instagramUrl: event.target.value,
                    }))
                  }
                  className="border border-border bg-background px-4 py-4 text-white outline-none"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    placeholder="Followers e.g. 48K"
                    value={form.followers}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        followers: event.target.value,
                      }))
                    }
                    className="border border-border bg-background px-4 py-4 text-white outline-none"
                  />
                  <input
                    placeholder="Coupon code"
                    value={form.couponCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        couponCode: event.target.value.toUpperCase(),
                      }))
                    }
                    className="border border-border bg-background px-4 py-4 text-white outline-none"
                  />
                </div>
                <textarea
                  placeholder="Short influencer bio / shoot description"
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bio: event.target.value }))
                  }
                  className="min-h-32 resize-y border border-border bg-background px-4 py-4 text-white outline-none"
                />
                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                  />
                  Show on public influencer page
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-foreground px-6 py-3 text-sm font-black text-background disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "SAVING..." : editingId ? "UPDATE INFLUENCER" : "SAVE INFLUENCER"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="border border-border px-6 py-3 text-sm font-black"
                    >
                      CANCEL EDIT
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <p className="text-muted-foreground">Loading influencers...</p>
              ) : influencers.length === 0 ? (
                <p className="text-muted-foreground">No influencers added yet.</p>
              ) : (
                influencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    className="overflow-hidden border border-border bg-secondary/20"
                  >
                    <div className="relative aspect-[3/4] bg-neutral-900">
                      {influencer.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={influencer.image}
                          alt={influencer.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UserRound className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black">
                            {influencer.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {influencer.username || "No username"}
                          </p>
                        </div>
                        <p
                          className={`text-xs font-black ${
                            influencer.active === false
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {influencer.active === false ? "HIDDEN" : "LIVE"}
                        </p>
                      </div>
                      <div className="mb-5 grid grid-cols-2 gap-3 border-y border-border py-4">
                        <div>
                          <p className="text-xs text-muted-foreground">FOLLOWERS</p>
                          <p className="font-black">{influencer.followers || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">COUPON</p>
                          <p className="font-black">{influencer.couponCode || "-"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => editInfluencer(influencer)}
                          className="border border-border px-4 py-3 text-sm font-black hover:bg-secondary"
                        >
                          EDIT
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteInfluencer(influencer)}
                          className="flex items-center gap-2 border border-border px-4 py-3 text-sm font-black text-red-400 hover:bg-secondary"
                        >
                          <Trash2 className="h-4 w-4" />
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        <Footer />
      </>
    </ProtectedRoute>
  )
}
