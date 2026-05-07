"use client"

import { useState } from "react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setStatus("loading")
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success")
      setEmail("")
    }, 1000)
  }

  return (
    <section className="py-16 sm:py-24 bg-background border-t border-border">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
          STAY AHEAD OF THE DROP
        </h2>
        <p className="text-muted-foreground text-sm mb-2">
          Early access, secret releases, and the inner circle.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          No spam.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ENTER YOUR EMAIL"
            className="flex-1 px-4 py-3 bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-8 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "..." : "SUBSCRIBE"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 text-sm text-accent">
            Welcome to the inner circle.
          </p>
        )}
      </div>
    </section>
  )
}
