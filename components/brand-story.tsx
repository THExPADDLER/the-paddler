import Image from "next/image"
import Link from "next/link"

export function BrandStory() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-[4/5] bg-neutral-100">
            <Image
              src="/images/brand-story.jpg"
              alt="Technical jacket product shot"
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              WHY PADDDLER?
            </h2>
            <div className="space-y-4 text-neutral-600">
              <p>
                Padddler is not just a brand. It&apos;s a mindset. Built for individuals who don&apos;t follow trends — they create them.
              </p>
              <p>
                Every piece reflects movement, identity, and raw street energy. Our design philosophy merges industrial durability with avant-garde silhouettes.
              </p>
            </div>
            <Link
              href="#"
              className="inline-block mt-8 text-sm font-medium underline underline-offset-4 hover:no-underline"
            >
              OUR MANIFESTO
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
