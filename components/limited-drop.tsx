import Image from "next/image"
import Link from "next/link"

export function LimitedDrop() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/limited-drop.jpg"
          alt="Silhouette in urban environment"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs sm:text-sm font-medium text-accent tracking-widest mb-4">
          DROP 01 — ARCHIVE ONLY
        </p>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 text-balance">
          LIMITED PIECES ONLY
        </h2>
        <p className="text-muted-foreground mb-8">
          Once it&apos;s gone, it&apos;s gone. No restocks.
        </p>
        <Link
          href="#shop"
          className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          Explore Drop
        </Link>
      </div>
    </section>
  )
}
