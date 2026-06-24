import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Instagram Drops And Streetwear Reels",
  description:
    "Follow THE PADDLER on Instagram for reels, streetwear drop teasers, creator shoots, and instant launch updates.",
  path: "/instagram",
  image: "/images/street-2.jpg",
  keywords: ["THE PADDLER Instagram", "streetwear reels", "drop teaser"],
})

export default function InstagramLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
