"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/#shop") {
      return pathname === "/"
    }
    return pathname === href
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-lg font-bold tracking-wider text-foreground">
            THE PADDDLER
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/#shop" 
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/#shop") 
                  ? "text-foreground border-b border-foreground pb-0.5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Shop
            </Link>
            <Link 
              href="/about" 
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/about") 
                  ? "text-foreground border-b border-foreground pb-0.5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              About
            </Link>
            <Link 
              href="/instagram" 
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/instagram") 
                  ? "text-foreground border-b border-foreground pb-0.5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Instagram
            </Link>
          </nav>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button 
              className="p-2 hover:bg-secondary rounded-sm transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button 
              className="md:hidden p-2 hover:bg-secondary rounded-sm transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <Link 
                href="/#shop" 
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive("/#shop") 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                href="/about" 
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive("/about") 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/instagram" 
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive("/instagram") 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Instagram
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
