export interface Product {
  id: number
  slug: string
  name: string
  description: string
  longDescription: string
  price: number
  image: string
  images: string[]
  badge: string | null
  badgeColor: string | null
  sizes: string[]
  colors: { name: string; value: string; hex: string }[]
  details: string[]
  care: string[]
  inStock: boolean
}

export const products: Product[] = [
  {
    id: 1,
    slug: "null-space-tee",
    name: "NULL SPACE TEE",
    description: "HEAVYWEIGHT COTTON",
    longDescription: "The NULL SPACE TEE is built for those who move different. Crafted from premium 280gsm heavyweight cotton, this tee delivers an oversized silhouette with a structured drape that holds its shape wear after wear. The minimal design speaks volumes without saying a word.",
    price: 85,
    image: "/images/tshirt-black.jpg",
    images: ["/images/tshirt-black.jpg"],
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Void Black", value: "black", hex: "#0a0a0a" },
      { name: "Concrete Grey", value: "grey", hex: "#4a4a4a" },
      { name: "Off White", value: "white", hex: "#f5f5f0" },
    ],
    details: [
      "280gsm premium heavyweight cotton",
      "Oversized, boxy fit",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Pre-shrunk fabric",
      "Embroidered logo at back neck",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron on low heat if needed",
      "Do not dry clean",
    ],
    inStock: true,
  },
  {
    id: 2,
    slug: "void-shell-v1",
    name: "VOID SHELL V1",
    description: "TECHNICAL OUTERWEAR",
    longDescription: "The VOID SHELL V1 is our flagship technical jacket. Engineered for the streets with a water-resistant shell, sealed seams, and strategic ventilation. The avant-garde silhouette merges industrial utility with refined aesthetics. Limited production run.",
    price: 320,
    image: "/images/jacket-olive.jpg",
    images: ["/images/jacket-olive.jpg"],
    badge: null,
    badgeColor: null,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Military Olive", value: "olive", hex: "#4a5a3a" },
      { name: "Stealth Black", value: "black", hex: "#0a0a0a" },
    ],
    details: [
      "Water-resistant technical fabric",
      "Fully taped seams",
      "YKK Aquaguard zippers",
      "Adjustable hood with wire brim",
      "Multiple utility pockets",
      "Adjustable cuffs and hem",
      "Inner mesh lining",
      "Reflective logo detailing",
    ],
    care: [
      "Machine wash cold on gentle cycle",
      "Do not use fabric softener",
      "Hang dry recommended",
      "Do not iron directly on prints",
      "Re-apply DWR treatment as needed",
    ],
    inStock: true,
  },
  {
    id: 3,
    slug: "grit-cargo",
    name: "GRIT CARGO",
    description: "CANVAS DUCK",
    longDescription: "The GRIT CARGO pants are built to last. Made from heavy-duty 12oz canvas duck fabric, these cargos feature reinforced knees, articulated construction for mobility, and enough pockets to carry your essentials. Raw industrial aesthetic meets functional design.",
    price: 145,
    image: "/images/cargo-black.jpg",
    images: ["/images/cargo-black.jpg"],
    badge: "SOLD OUT",
    badgeColor: "bg-red-600 text-white",
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: [
      { name: "Washed Black", value: "black", hex: "#1a1a1a" },
      { name: "Stone", value: "stone", hex: "#8a8070" },
    ],
    details: [
      "12oz heavy canvas duck fabric",
      "Relaxed tapered fit",
      "Reinforced knee panels",
      "6-pocket design with cargo pockets",
      "YKK zipper fly with button closure",
      "Articulated knees for mobility",
      "Triple-stitched seams",
      "Adjustable ankle snaps",
    ],
    care: [
      "Machine wash cold",
      "Wash inside out",
      "Tumble dry low",
      "Fabric will soften with each wash",
      "Iron on medium heat",
    ],
    inStock: false,
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id)
}
