import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/checkout",
        "/account",
        "/addresses",
        "/cart",
        "/wishlist",
        "/orders",
        "/invoice",
        "/login",
        "/signup",
        "/payment-status",
        "/thank-you",
      ],
    },
    sitemap: "https://thepaddler.in/sitemap.xml",
  }
}
