export interface Product {
  id: number
  slug: string
  name: string
  description: string
  longDescription: string
  price: number
  mrp?: number | null
  image: string
  images: string[]
  badge: string | null
  badgeColor: string | null
  sizes: string[]
  color: string
  colorHex: string
  details: string[]
  care: string[]
  tags?: string[]
  inStock: boolean
  stock?: number
  stockBySize?: Record<string, number>
}

const defaultDetails = [
  "240 GSM premium heavyweight cotton",
  "Oversized drop-shoulder fit",
  "Ribbed crew neckline",
  "Double-stitched hems",
  "Made in India",
]

const defaultCare = [
  "Machine wash cold with like colors",
  "Do not bleach",
  "Tumble dry low",
  "Iron inside out on low heat",
]

const emptyStock = {
  S: 0,
  M: 0,
  L: 0,
}

export const products: Product[] = [
  {
    id: 1,
    slug: "be-a-weed-tee",
    name: "BE A W**D TEE",
    description: "OVERSIZED FIT",
    longDescription:
      "The BE A W**D TEE is a beige oversized streetwear piece built around calm rebellion and quiet individuality. A minimal chest mark keeps the front clean, while the back graphic delivers the statement: in a world full of roses, be different.",
    price: 999,
    mrp: null,
    image: "/images/products/be-a-weed-tee-front.png",
    images: [
      "/images/products/be-a-weed-tee-front.png",
      "/images/products/be-a-weed-tee-back.png",
    ],
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
    sizes: ["S", "M", "L"],
    color: "Beige",
    colorHex: "#d8c5aa",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Minimal chest mark",
      "Statement back graphic",
      "Ribbed crew neckline",
      "Made in India",
    ],
    care: defaultCare,
    tags: [
      "beige oversized t-shirt",
      "be a weed tee",
      "graphic back print tee",
      "paddler streetwear",
      "240 gsm t-shirt",
    ],
    inStock: false,
    stock: 0,
    stockBySize: emptyStock,
  },
  {
    id: 2,
    slug: "9-lives-to-live-tee",
    name: "9 LIVES TO LIVE TEE",
    description: "OVERSIZED FIT",
    longDescription:
      "The 9 LIVES TO LIVE TEE is a white oversized graphic tee made for the ones who keep coming back sharper. A clean front chest mark keeps it minimal, while the back graphic brings the full drop energy.",
    price: 999,
    mrp: null,
    image: "/images/products/9-lives-to-live-tee-front.png",
    images: [
      "/images/products/9-lives-to-live-tee-front.png",
      "/images/products/9-lives-to-live-tee-back.png",
    ],
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
    sizes: ["S", "M", "L"],
    color: "White",
    colorHex: "#f5f5f5",
    details: [
      ...defaultDetails,
      "Minimal chest mark",
      "Statement back graphic",
    ],
    care: defaultCare,
    tags: [
      "white oversized t-shirt",
      "9 lives to live tee",
      "graphic back print tee",
      "paddler streetwear",
      "240 gsm t-shirt",
    ],
    inStock: false,
    stock: 0,
    stockBySize: emptyStock,
  },
  {
    id: 3,
    slug: "karma-is-a-bitch-tee",
    name: "KARMA IS A BITCH TEE",
    description: "OVERSIZED FIT",
    longDescription:
      "The KARMA IS A BITCH TEE keeps the front clean with a minimal chest mark and saves the punch for the back. A bold illustrated graphic brings loud street attitude to a crisp white oversized silhouette.",
    price: 999,
    mrp: null,
    image: "/images/products/karma-is-a-bitch-tee-front.png",
    images: [
      "/images/products/karma-is-a-bitch-tee-front.png",
      "/images/products/karma-is-a-bitch-tee-back.png",
    ],
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
    sizes: ["S", "M", "L"],
    color: "White",
    colorHex: "#f5f5f5",
    details: [
      ...defaultDetails,
      "Minimal chest mark",
      "Statement back graphic",
    ],
    care: defaultCare,
    tags: [
      "white oversized t-shirt",
      "karma is a bitch tee",
      "graphic back print tee",
      "paddler streetwear",
      "240 gsm t-shirt",
    ],
    inStock: false,
    stock: 0,
    stockBySize: emptyStock,
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getRelatedProducts(currentSlug: string, limit: number = 4): Product[] {
  return products.filter((p) => p.slug !== currentSlug).slice(0, limit)
}

export function getProductsByColor(color: string): Product[] {
  return products.filter((p) => p.color === color)
}
