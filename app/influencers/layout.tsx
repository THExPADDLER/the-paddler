import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Creators And Influencers",
  description:
    "Meet THE PADDLER creators, streetwear influencers, and campaign faces shaping the next drop.",
  path: "/influencers",
  image: "/images/street-4.jpg",
  keywords: ["streetwear influencers", "THE PADDLER creators", "fashion creators India"],
})

export default function InfluencersLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
