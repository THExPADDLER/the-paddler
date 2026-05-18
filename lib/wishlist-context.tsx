"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "@/lib/firebase"

export interface WishlistItem {
  id: number
  name: string
  description: string
  price: number
  mrp?: number
  image: string
  slug?: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: number) => void
  isInWishlist: (id: number) => boolean
  totalWishlistItems: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [storageKey, setStorageKey] = useState("the-paddler-wishlist-guest")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setStorageKey(
        firebaseUser
          ? `the-paddler-wishlist-${firebaseUser.uid}`
          : "the-paddler-wishlist-guest"
      )
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const savedWishlist = localStorage.getItem(storageKey)

    if (savedWishlist) {
      setItems(JSON.parse(savedWishlist))
    } else {
      setItems([])
    }

    setIsLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  }, [items, isLoaded, storageKey])

  const addToWishlist = (item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((wishlistItem) => wishlistItem.id === item.id)

      if (exists) {
        return prev
      }

      return [...prev, item]
    })
  }

  const removeFromWishlist = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const isInWishlist = (id: number) => {
    return items.some((item) => item.id === id)
  }

  const totalWishlistItems = items.length

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        totalWishlistItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)

  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }

  return context
}
