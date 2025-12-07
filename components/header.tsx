"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#products", label: "Products" },
  { href: "#contact", label: "Contact" },
]

const LOGO_DARK_BG = "/images/wiyone-logo-whitetext.svg" // white text, for dark hero
const LOGO_LIGHT_BG = "/images/wiyone-logo-blacktext.svg" // black text, for white sections

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"}`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src={isScrolled ? LOGO_LIGHT_BG : LOGO_DARK_BG}
              alt="Wiyone Charcoal"
              width={140}
              height={70}
              className="h-12 w-auto"
              unoptimized
            />
          </Link>

          {/* Desktop Nav - Increased text size from text-xs to text-base */}
          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium tracking-wide transition-colors ${isScrolled ? "text-slate-700 hover:text-teal-600" : "text-white/90 hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button
              asChild
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 rounded-full px-6 h-11 text-sm font-medium"
            >
              <Link href="#contact">Get Quote</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden ${isScrolled ? "text-slate-900" : "text-white"}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="bg-white py-4 md:hidden rounded-b-xl shadow-lg border-t border-slate-100">
            <nav className="flex flex-col gap-1 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base text-slate-600 hover:text-teal-600 px-3 py-3 rounded-lg hover:bg-slate-50 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                asChild
                className="mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full text-base h-11"
              >
                <Link href="#contact" onClick={() => setIsMenuOpen(false)}>
                  Get Quote
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
