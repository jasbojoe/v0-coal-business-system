"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { useCompanySettings } from "@/lib/hooks/useCompanySettings"

const ENVIR_LOGO = "/images/envir-logo.svg"
const SIERRA_LEONE_ICON = "/images/sierra-leone-icon.png"
const COALS_BANNER = "/images/coalsartboard-1-201.png"

// local fallback
const FALLBACK_FOOTER_LOGO = "/images/wiyone-logo-blacktext.svg"

const footerLinks = {
  company: [
    { label: "About", href: "#about" },
    { label: "Products", href: "#products" },
    { label: "Contact", href: "#contact" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
}

export function Footer() {
  const { data: company } = useCompanySettings()

  const brandName = company?.company_name || "Wiyone Charcoal"

  // Dynamic social links from database
  const socialLinks = [
    { icon: Facebook, href: company?.facebook_url || "#", label: "Facebook" },
    { icon: Twitter, href: company?.twitter_url || "#", label: "Twitter" },
    { icon: Instagram, href: company?.instagram_url || "#", label: "Instagram" },
    { icon: Linkedin, href: company?.linkedin_url || "#", label: "LinkedIn" },
  ].filter(link => link.href && link.href !== "#")

  // For footer (dark background), prefer light logo if you have it
  const footerLogo =
    company?.logo_light_url || company?.logo_url || FALLBACK_FOOTER_LOGO

  const locationLine = [company?.address, company?.city, company?.country].filter(Boolean).join(", ")

  return (
    <footer className="relative bg-slate-900 overflow-hidden">
      {/* Coal banner */}
      <div className="absolute top-0 left-0 right-0 h-16 opacity-20">
        <Image
          src={COALS_BANNER || "/placeholder.svg"}
          alt=""
          fill
          className="object-cover object-bottom"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 pt-20">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Image
              src={footerLogo || "/placeholder.svg"}
              alt={brandName}
              width={140}
              height={70}
              className="h-14 w-auto"
              unoptimized
            />

            <p className="mt-4 max-w-sm text-sm text-slate-400 leading-relaxed">
              Premium, eco-friendly charcoal crafted from renewable waste. Cleaner, longer-lasting fuel for homes and
              businesses.
            </p>

            {/* ✅ Dynamic company info */}
            <div className="mt-4 space-y-1 text-sm text-slate-400">
              {company?.phone ? <p>📞 {company.phone}</p> : null}
              {company?.business_email ? <p>✉️ {company.business_email}</p> : null}
              {locationLine ? <p>📍 {locationLine}</p> : null}
              {company?.website ? (
                <p>
                  🌐{" "}
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-teal-300"
                  >
                    {company.website}
                  </a>
                </p>
              ) : null}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-teal-500 hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-medium text-white">Company</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">Legal</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-slate-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="flex items-center gap-2">
              <Image src={ENVIR_LOGO || "/placeholder.svg"} alt="Envir Solutions" width={28} height={28} unoptimized />
              <p className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} Envir Solutions. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src={SIERRA_LEONE_ICON || "/placeholder.svg"}
                alt="Sierra Leone"
                width={18}
                height={18}
                className="rounded-full"
                unoptimized
              />
              <p className="text-sm text-slate-500">Made in Sierra Leone</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
