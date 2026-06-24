import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "./providers/AuthProvider"
import { MaintenanceGate } from "@/components/maintenance-gate"
import { ScrollAtmosphere } from "@/components/scroll-atmosphere"
import { WhatsAppButton } from "@/components/whatsapp-button"


import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import {
  brandDescription,
  brandLogo,
  buildMetadata,
  defaultOgImage,
  organizationJsonLd,
  siteName,
  siteTagline,
  siteUrl,
  websiteJsonLd,
} from "@/lib/seo"

import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  ...buildMetadata({
    description: brandDescription,
    image: defaultOgImage,
    keywords: [
      "oversized t-shirts India",
      "premium streetwear India",
      "THE PADDLER clothing",
      "limited streetwear drops",
      "heavyweight cotton tee",
    ],
  }),
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "fashion",
  icons: {
    icon: [
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
}

export const viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <WishlistProvider>
          <CartProvider>
            <AuthProvider>
              <MaintenanceGate />
              <ScrollAtmosphere />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify([
                    organizationJsonLd,
                    websiteJsonLd,
                    {
                      "@context": "https://schema.org",
                      "@type": "ClothingStore",
                      name: siteName,
                      slogan: siteTagline,
                      url: siteUrl,
                      logo: `${siteUrl}${brandLogo}`,
                      image: `${siteUrl}${defaultOgImage}`,
                      priceRange: "₹₹",
                      address: {
                        "@type": "PostalAddress",
                        addressCountry: "IN",
                      },
                      sameAs: ["https://www.instagram.com/thepaddler.in"],
                    },
                  ]),
                }}
              />
              {children}
            </AuthProvider>
          </CartProvider>
          <WhatsAppButton/>
        </WishlistProvider>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
