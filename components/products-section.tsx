"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Flame, Clock, Wind, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  name: string
  description: string | null
  image_url: string | null
  unit_price: number
  stock_quantity: number
  is_active: boolean
  sku: string | null
  unit: string | null
  category_id: string | null
  category?: {
    id: string
    name: string
  } | null
}

const fallbackProducts = [
  {
    id: "1",
    name: "Premium Briquettes",
    description: "Our flagship product. Perfect for grilling, cooking, and heating.",
    image_url: "/images/wi-20yone-20sample-20100kg-201.png",
    unit_price: 0,
    stock_quantity: 100,
    is_active: true,
    sku: null,
    unit: "kg",
    category_id: null,
    category: { id: "1", name: "Briquettes" },
  },
  {
    id: "2",
    name: "Shisha Charcoal",
    description: "Quick-lighting, odorless, and provides consistent heat for hookah.",
    image_url: "/images/shisha.png",
    unit_price: 0,
    stock_quantity: 100,
    is_active: true,
    sku: null,
    unit: "kg",
    category_id: null,
    category: { id: "2", name: "Shisha" },
  },
  {
    id: "3",
    name: "Restaurant Grade",
    description: "Industrial-grade charcoal for restaurants and food businesses.",
    image_url: "/images/grill-with-variety-meats-it-201.png",
    unit_price: 0,
    stock_quantity: 100,
    is_active: true,
    sku: null,
    unit: "kg",
    category_id: null,
    category: { id: "3", name: "Commercial" },
  },
]

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchProducts() {
      try {
        const supabase = createClient()

        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            image_url,
            unit_price,
            stock_quantity,
            is_active,
            sku,
            unit,
            category_id,
            category:product_categories(id, name)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6)

        if (!error && data && data.length > 0 && isMounted) {
          // Transform the data to handle the category relationship
          const transformedProducts = data.map((product: any) => ({
            ...product,
            category: Array.isArray(product.category) ? product.category[0] : product.category,
          }))
          setProducts(transformedProducts)
        }
      } catch (error) {
        // Silent fail - use fallback products
        console.error("Error fetching products:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section id="products" className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">Our Products</span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl tracking-tight">
            Premium Charcoal Solutions
          </h2>
          <p className="mt-3 text-slate-600 text-sm">Sustainable charcoal products for every need.</p>
        </div>

        {loading ? (
          <div className="mt-10 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all"
              >
                {index === 0 && (
                  <Badge className="absolute right-3 top-3 z-10 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 text-xs">
                    Popular
                  </Badge>
                )}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50 p-6">
                  <Image
                    src={product.image_url || "/placeholder.svg?height=300&width=400&query=charcoal product"}
                    alt={product.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <Badge variant="outline" className="mb-2 w-fit text-xs border-teal-200 text-teal-700">
                    {product.category?.name || "Charcoal"}
                  </Badge>
                  <h3 className="font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-1 flex-1 text-xs text-slate-500 leading-relaxed">
                    {product.description || "Premium quality charcoal product."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.unit_price > 0 && (
                      <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700 border border-teal-200 font-medium">
                        ${product.unit_price.toFixed(2)}/{product.unit || "unit"}
                      </span>
                    )}
                    {product.stock_quantity > 0 && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 border border-slate-200">
                        In Stock
                      </span>
                    )}
                    {product.stock_quantity === 0 && (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 border border-red-200">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <Button
                    asChild
                    className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800 rounded-full text-xs h-9"
                  >
                    <Link href="#contact">
                      Request Quote <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Features bar */}
        <div className="mt-12 rounded-2xl bg-slate-900 p-6 lg:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Flame, title: "High Heat Output", desc: "Consistent, high temperatures." },
              { icon: Clock, title: "3x Longer Burn", desc: "Burns longer than conventional charcoal." },
              { icon: Wind, title: "Low Smoke & Ash", desc: "Clean burning with minimal residue." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
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
      </div>
    </section>
  )
}
