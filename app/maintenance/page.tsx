import Image from "next/image"
import Link from "next/link"
import { Instagram, Mail, MessageCircle } from "lucide-react"

const socials = [
  {
    label: "Instagram",
    handle: "@thepaddler.in",
    href: "https://instagram.com/thepaddler.in",
    icon: Instagram,
  },
  {
    label: "WhatsApp",
    handle: "+91 8103631364",
    href: "https://wa.me/918103631364",
    icon: MessageCircle,
  },
  {
    label: "Email",
    handle: "support@thepaddler.in",
    href: "mailto:support@thepaddler.in",
    icon: Mail,
  },
]

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-3xl text-center">
        <div className="mb-10 flex justify-center">
          <Image
            src="/images/paddler-logo-removedbg.png"
            alt="THE PADDLER"
            width={320}
            height={104}
            className="h-24 w-auto object-contain"
            priority
          />
        </div>

        <p className="mb-4 text-xs tracking-[0.45em] text-muted-foreground">
          SITE UNDER MAINTENANCE
        </p>

        <h1 className="text-4xl sm:text-6xl font-black leading-none">
          WE ARE TUNING THE DROP.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
          Soon you will get update as it start working. Till that, stay tuned.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {socials.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                className="border border-border bg-secondary/20 p-5 hover:bg-secondary transition-colors"
              >
                <Icon className="mx-auto mb-4 h-6 w-6" />
                <p className="text-xs tracking-[0.25em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-black">{item.handle}</p>
              </Link>
            )
          })}
        </div>

        <p className="mt-10 text-sm font-black tracking-[0.3em] text-muted-foreground">
          FOLLOW FOR INSTANT UPDATES
        </p>
      </section>
    </main>
  )
}
