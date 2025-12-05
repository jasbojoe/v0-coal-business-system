import Image from "next/image"
import { Check, TrendingUp, Shield, Truck } from "lucide-react"

const benefits = [
  "100% renewable waste materials",
  "3x longer burn time",
  "Low smoke and minimal ash",
  "Supports local communities",
]

export function WhyChooseSection() {
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">Why Choose Us</span>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl tracking-tight">
              The Wiyone Difference
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Supporting a sustainable future with premium quality that outperforms the competition.
            </p>
            <ul className="mt-6 space-y-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100">
                    <Check className="h-3 w-3 text-teal-600" />
                  </div>
                  <span className="text-sm text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {[
              { icon: Shield, title: "Quality Guaranteed", desc: "Every batch tested for consistency." },
              { icon: TrendingUp, title: "Sustainable Growth", desc: "Expanding while staying eco-friendly." },
              { icon: Truck, title: "Reliable Supply", desc: "Consistent production for all orders." },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl bg-white p-4 border border-slate-200 hover:shadow-md hover:border-teal-200 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-slate-900">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-10">
              <Image src="/images/fireforvector.svg" alt="Fire For Longer" width={200} height={80} className="mb-4" />
              <p className="text-slate-300 text-sm max-w-md">
                Join hundreds of satisfied customers who have switched to Wiyone Charcoal.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-2.5 text-sm font-medium text-white hover:from-teal-600 hover:to-emerald-600 transition-all"
                >
                  Contact Sales
                </a>
                <a
                  href="tel:+23276123456"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Call Us
                </a>
              </div>
            </div>
            <div className="relative hidden lg:block h-64">
              <Image src="/images/grill-with-variety-meats-it-201.png" alt="Grilling" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
