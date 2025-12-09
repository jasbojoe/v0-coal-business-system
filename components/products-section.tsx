import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Flame, Clock, Wind } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

type ProductRow = {
  id: string
  name: string
  description: string | null
  unit_price: number
  unit: string
  stock_quantity: number
  image_url: string | null
  is_featured: boolean | null
  product_categories: { name: string | null } | null
}

const highlights = [
  {
    icon: Flame,
    title: "3x Longer Burn",
    desc: "Engineered briquettes that burn longer than traditional charcoal.",
  },
  {
    icon: Clock,
    title: "Fast Lighting",
    desc: "Ready to cook in minutes with minimal smoke.",
  },
  {
    icon: Wind,
    title: "Low Smoke",
    desc: "Cleaner burn for homes, restaurants, and shisha lounges.",
  },
]

function formatPrice(unit_price: number, unit: string) {
  if (Number.isNaN(unit_price)) return ""
  return `$${unit_price.toFixed(2)}/${unit}`
}

export async function ProductsSection() {
  const supabase = await createClient()

  // 1. Try featured products
  const { data: featured, error } = await supabase
    .from("products")
    .select(
      "id, name, description, unit_price, unit, stock_quantity, image_url, is_featured, product_categories(name)"
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: true })
    .limit(3)

  let products: ProductRow[] = featured || []

  // 2. Fallback to first 3 active if none featured or error
  if ((!products || products.length === 0) || error) {
    const { data: fallback } = await supabase
      .from("products")
      .select(
        "id, name, description, unit_price, unit, stock_quantity, image_url, is_featured, product_categories(name)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(3)

    products = fallback || []
  }

  if (!products || products.length === 0) return null

  return (
    <section id="products" className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">
            Our Products
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl tracking-tight">
            Premium Charcoal Solutions
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Sustainable charcoal products for every need.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {products.map((product, index) => {
            const inStock = (product.stock_quantity ?? 0) > 0

            return (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all bg-slate-50/60"
              >
                {index === 0 && (
                  <Badge className="absolute right-3 top-3 z-10 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 text-xs">
                    Popular
                  </Badge>
                )}

                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="mb-1 w-fit text-[11px] border-teal-200 text-teal-700"
                    >
                      {product.product_categories?.name || "Charcoal"}
                    </Badge>
                    <span className="text-[11px] font-medium text-slate-500">
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          ● <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500">
                          ● <span>Out of Stock</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <h3 className="mt-1 font-semibold text-slate-900 text-sm md:text-base">
                    {product.name}
                  </h3>
                  <p className="mt-1 flex-1 text-xs text-slate-500 leading-relaxed">
                    {product.description ??
                      "Premium eco-friendly charcoal crafted from renewable waste."}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      {formatPrice(product.unit_price, product.unit)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Stock: {product.stock_quantity ?? 0} {product.unit}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Flame className="h-4 w-4 text-teal-500" />
                      <span>Eco-friendly &amp; efficient</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                    >
                      <Link href="#contact" className="inline-flex items-center gap-1">
                        Request Quote
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 md:flex-row md:justify-between rounded-2xl bg-slate-900 px-6 py-8 sm:px-8 sm:py-10">
          <div>
            <h3 className="text-sm font-semibold text-white sm:text-base">
              Need bulk or custom orders?
            </h3>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              We supply homes, restaurants, hotels, and distributors across Sierra Leone.
            </p>
          </div>
          <Button
            asChild
            className="bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm"
          >
            <Link href="/products">
              View All Products
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">{item.title}</h4>
                <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
