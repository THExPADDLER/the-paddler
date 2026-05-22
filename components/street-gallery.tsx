import Image from "next/image"

const images = [
  {
    src: "/images/street-1.jpg",
    alt: "Person running in urban streetwear",
    label: "CITY RUN",
  },
  {
    src: "/images/street-2.jpg",
    alt: "Street style fashion photo",
    label: "WALL ENERGY",
  },
  {
    src: "/images/street-3.jpg",
    alt: "Urban fashion photography",
    label: "NIGHT TUNNEL",
  },
  {
    src: "/images/street-4.jpg",
    alt: "Street photography with streetwear",
    label: "CONCRETE FIT",
  },
]

export function StreetGallery() {
  return (
    <section className="street-gallery-stage relative overflow-hidden py-16 sm:py-24 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.13),transparent_26%),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:auto,58px_58px]" />
      <div className="pointer-events-none absolute left-0 right-0 top-12 rotate-[1.5deg] border-y border-white/10 bg-white/5 py-2 text-xs font-black tracking-[0.45em] text-white/35 animate-[featured-ticker-reverse_24s_linear_infinite] whitespace-nowrap">
        WORN BY THE STREETS / SHOT IN MOTION / BUILT FOR THE OUTSIDE / WORN BY THE STREETS / SHOT IN MOTION / BUILT FOR THE OUTSIDE /
      </div>
      <div className="pointer-events-none absolute -left-16 bottom-8 text-[14vw] font-black leading-none text-white/[0.035] animate-[featured-word-drift_8s_ease-in-out_infinite]">
        STREET
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="mx-auto mb-4 w-fit border border-white/15 bg-white/5 px-3 py-2 text-xs tracking-[0.35em] text-white/55">
          COMMUNITY FITS
        </p>

        <h2 className="text-3xl sm:text-5xl font-black tracking-normal text-center text-foreground italic mb-12">
          WORN BY THE STREETS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.src}
              className="street-frame group relative aspect-[4/5] bg-secondary overflow-hidden cursor-pointer"
              style={{ animationDelay: `${index * 130}ms` }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-112"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent opacity-70 transition-opacity group-hover:opacity-95" />
              <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-xl font-black text-white">{image.label}</p>
                <p className="mt-1 text-[10px] tracking-[0.28em] text-white/50">
                  THE PADDLER FIELD FILE
                </p>
              </div>
              <div className="absolute left-4 top-4 border border-white/20 bg-black/35 px-3 py-2 text-xs font-black text-white backdrop-blur">
                0{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
