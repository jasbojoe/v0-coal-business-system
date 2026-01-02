"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

const carouselSlides = [
  {
    image: "/images/grill-with-variety-meats-it-201.png",
    alt: "Grilling with Wiyone Charcoal",
  },
  {
    image: "/images/briquettes.png",
    alt: "Hot Charcoal Briquettes",
  },
  {
    image: "/images/shisha.png",
    alt: "Shisha Charcoal",
  },
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)

  return (
    <section id="home" className="relative h-screen max-h-[900px] min-h-[600px] overflow-hidden bg-[#0f172a]">
      {/* Background carousel */}
      {carouselSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slide.image || "/placeholder.svg"}
            alt={slide.alt}
            fill
            className="object-cover opacity-40"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-[#0f172a]/50" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 lg:px-8">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex lg:hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10">
            <Image
              src="/images/sierra-leone-icon.png"
              alt="Sierra Leone"
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-xs font-medium text-white/80 tracking-wide">Made in Sierra Leone</span>
          </div>

          {/* Fire for Longer logo */}
          <Image src="/images/fireforvector.svg" alt="Fire for Longer" width={220} height={90} className="mb-4" />

          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl tracking-tight">
            Premium{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              Eco-Friendly
            </span>{" "}
            Charcoal
          </h1>

          <p className="mt-4 max-w-md text-base text-slate-300 leading-relaxed">
            Crafted from 100% renewable waste. Smokeless, long-lasting fuel for homes, restaurants, and shisha lounges.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 rounded-full px-6 h-11 text-sm font-medium shadow-lg shadow-teal-500/25"
            >
              <Link href="#products">
                Explore Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-full px-6 h-11 text-sm backdrop-blur-sm"
            >
              <Link href="#contact">Get Quote</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-10 flex gap-8 border-t border-white/10 pt-8">
            <div>
              <div className="text-2xl font-bold text-white">#1</div>
              <div className="text-xs text-slate-400">Supplier in SL</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-slate-400">Eco-Friendly</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">3x</div>
              <div className="text-xs text-slate-400">Longer Burn</div>
            </div>
          </div>
        </div>

        {/* Product bag - hidden on mobile */}
        <div className="absolute right-8 bottom-8 hidden lg:block">
          <Image
            src="/images/wi-20yone-20sample-20100kg-201.png"
            alt="Wiyone Charcoal 100KG Bag"
            width={320}
            height={400}
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${index === currentSlide ? "w-6 bg-teal-400" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
