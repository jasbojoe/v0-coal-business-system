"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useCompanySettings } from "@/lib/hooks/useCompanySettings"

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "#contact", label: "Contact" },
]

const FALLBACK_LOGO_LIGHT = "/images/wiyone-logo-whitetext.svg"
const FALLBACK_LOGO_DARK = "/images/wiyone-logo-blacktext.svg"

export function Header() {
  const { data: company } = useCompanySettings()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const lightLogo = company?.logo_light_url || company?.logo_url || FALLBACK_LOGO_LIGHT
  const darkLogo = company?.logo_dark_url || company?.logo_url || FALLBACK_LOGO_DARK
  const logoSrc = isScrolled ? darkLogo : lightLogo

  const brandName = company?.company_name || "Wiyone Charcoal"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image
                src={logoSrc || "/placeholder.svg"}
                alt={brandName}
                width={140}
                height={70}
                className="h-10 w-auto"
                priority
                unoptimized
              />
            </Link>

            {/* Badge - only visible on desktop, moved to header */}
            <div className="hidden lg:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm border border-white/10">
              <Image
                src="/images/sierra-leone-icon.png"
                alt="Sierra Leone"
                width={16}
                height={16}
                className="rounded-full"
              />
              <span className={`text-xs font-medium tracking-wide ${isScrolled ? "text-slate-600" : "text-white/90"}`}>
                Made in Sierra Leone
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors ${
                  isScrolled ? "text-slate-900 hover:text-emerald-600" : "text-white hover:text-emerald-300"
                }`}
              >
                {link.label}
              </a>
            ))}
            <Button asChild className={isScrolled ? "" : "bg-white text-slate-900 hover:bg-slate-100"}>
              <a href="#contact">Get Quote</a>
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className={`md:hidden ${isScrolled ? "text-slate-900" : "text-white"}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div
          className={`md:hidden border-t ${
            isScrolled ? "bg-white/95 backdrop-blur-md border-slate-200" : "bg-slate-900/95 border-slate-800"
          }`}
        >
          <nav className="mx-auto max-w-7xl px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-base font-medium ${isScrolled ? "text-slate-900" : "text-white"}`}
              >
                {link.label}
              </a>
            ))}
            <Button asChild className="w-full" variant={isScrolled ? "default" : "secondary"}>
              <a href="#contact" onClick={() => setIsMenuOpen(false)}>
                Get Quote
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
