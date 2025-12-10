import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Flame } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

type ProductRow = {
  id: string
  name: string
  description: string | null
  unit_price: number
  unit: string
  stock_quantity: number
  image_url: string | null
  is_active: boolean | null
  is_featured: boolean | null
}

function formatPrice(price: number | null | undefined, unit: string | null | undefined) {
  if (price == null || Number.isNaN(price)) return ""
  return `$${price.toFixed(2)}/${unit || ""}`
}

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, unit_price, unit, stock_quantity, image_url, is_active, is_featured")
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  const products: ProductRow[] = data ?? []

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-600">
              Products
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
              All Charcoal Products
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Browse the full Wiyone Charcoal product range for homes, restaurants, shisha lounges,
              and wholesale buyers.
            </p>
          </div>

          {/* Error state */}
          {error && (
            <p className="mt-8 text-sm text-rose-600">
              Failed to load products. Please try again later.
            </p>
          )}

          {/* Empty state */}
          {!error && products.length === 0 && (
            <p className="mt-8 text-sm text-slate-500">
              No products have been added yet. Use the admin dashboard to create products.
            </p>
          )}

          {/* Products grid */}
          {products.length > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {products.map((product) => {
                const inStock = (product.stock_quantity ?? 0) > 0

                return (
                  <div
                    key={product.id}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all"
                  >


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
                          Charcoal
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

                      <h2 className="mt-1 font-semibold text-slate-900 text-sm md:text-base">
                        {product.name}
                      </h2>
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
                          <Link href="/#contact" className="inline-flex items-center gap-1">
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
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
