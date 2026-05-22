"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) return

    setStatus("loading")

    window.setTimeout(() => {
      setStatus("success")
      setEmail("")
    }, 1000)
  }

  return (
    <section className="newsletter-stage relative overflow-hidden bg-background py-20 sm:py-28 text-foreground border-t border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_16%_80%,rgba(255,255,255,0.07),transparent_20%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-6 rotate-[-2deg] border-y border-white/10 bg-white/5 py-2 text-xs font-black tracking-[0.45em] text-white/35 animate-[featured-ticker_20s_linear_infinite] whitespace-nowrap">
        EARLY ACCESS / SECRET RELEASES / INNER CIRCLE / EARLY ACCESS / SECRET RELEASES / INNER CIRCLE /
      </div>
      <div className="pointer-events-none absolute -right-10 bottom-[-0.18em] text-[13vw] font-black leading-none text-white/[0.04] animate-[featured-word-drift_8s_ease-in-out_infinite]">
        UPDATE
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="mx-auto mb-5 w-fit border border-white/15 bg-white/5 px-3 py-2 text-xs tracking-[0.35em] text-white/55 backdrop-blur">
          MEMBERS ONLY SIGNAL
        </p>

        <h2 className="text-4xl sm:text-6xl font-black tracking-normal leading-[0.95] text-foreground mb-5">
          STAY AHEAD
          <br />
          OF THE DROP
        </h2>

        <p className="mx-auto mb-9 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
          Early access, secret releases, and first notice before pieces move out.
          No spam. Only signals.
        </p>

        <form
          onSubmit={handleSubmit}
          className="newsletter-form mx-auto flex max-w-2xl flex-col gap-3 border border-white/12 bg-white/[0.04] p-3 backdrop-blur sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ENTER YOUR EMAIL"
            className="min-h-14 flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="hero-cta inline-flex min-h-14 items-center justify-center gap-2 bg-foreground px-8 text-sm font-black text-background disabled:opacity-50"
          >
            {status === "loading" ? "SENDING" : "SUBSCRIBE"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {status === "success" && (
          <p className="mt-5 text-sm font-black text-white">
            Welcome to the inner circle.
          </p>
        )}
      </div>
    </section>
  )
}
