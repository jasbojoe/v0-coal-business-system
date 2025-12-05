import Image from "next/image"
import { Leaf, Recycle, Factory, Users } from "lucide-react"

const values = [
  { icon: Recycle, title: "Waste to Energy", description: "Transforming agricultural waste into premium fuel." },
  { icon: Leaf, title: "Eco-Friendly", description: "Zero deforestation. Protecting forests." },
  { icon: Factory, title: "Quality Production", description: "State-of-the-art facilities." },
  { icon: Users, title: "Community Impact", description: "Creating jobs locally." },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">About Us</span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl tracking-tight">
            We Are Envir Solutions
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Makers of Wiyone Charcoal — premium, high-quality charcoal crafted from renewable sources for sustainable
            energy.
          </p>
        </div>

        {/* Content grid */}
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            <Image
              src="/images/display-tent-mockup-v01-201.png"
              alt="Wiyone Charcoal Display"
              width={500}
              height={400}
              className="rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg">
              <Image src="/images/envir-logo.svg" alt="Envir Solutions" width={60} height={60} />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900">Our Story</h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Founded with a vision to revolutionize the charcoal industry in Sierra Leone. We collect agricultural
              waste and organic materials, transforming them into premium charcoal briquettes that burn longer, cleaner,
              and more efficiently.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
              <Image
                src="/images/sierra-leone-icon.png"
                alt="Sierra Leone"
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-xs font-medium text-slate-700">Proudly Made in Sierra Leone</span>
            </div>
          </div>
        </div>

        {/* Values grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-xl bg-white p-5 border border-slate-200 hover:shadow-md hover:border-teal-200 transition-all"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                <value.icon className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">{value.title}</h4>
              <p className="mt-1 text-xs text-slate-500">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
