import Image from "next/image"

const images = [
  { src: "/images/street-1.jpg", alt: "Person running in urban streetwear" },
  { src: "/images/street-2.jpg", alt: "Street style fashion photo" },
  { src: "/images/street-3.jpg", alt: "Urban fashion photography" },
  { src: "/images/street-4.jpg", alt: "Street photography with streetwear" },
]

export function StreetGallery() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-foreground italic mb-10">
          WORN BY THE STREETS
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="relative aspect-square bg-secondary overflow-hidden group cursor-pointer"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
