import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Wiyone Charcoal | Premium Eco-Friendly Charcoal - Fire for Longer",
  description:
    "Premium eco-friendly charcoal briquettes crafted from 100% renewable waste. Smokeless, long-lasting fuel for homes, restaurants, and shisha lounges. Made in Sierra Leone.",
  generator: "v0.app",
  keywords: ["charcoal", "briquettes", "eco-friendly", "sustainable", "shisha", "Sierra Leone", "Wiyone"],
  icons: {
    icon: [{ url: "/images/fireforvector.svg", type: "image/svg+xml" }],
    shortcut: "/images/fireforvector.svg",
    apple: "/images/fireforvector.svg",
  },
  openGraph: {
    title: "Wiyone Charcoal - Premium Eco-Friendly Charcoal",
    description: "Premium eco-friendly charcoal briquettes. Fire for Longer.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
