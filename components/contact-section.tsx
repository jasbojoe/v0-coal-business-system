"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Loader2 } from "lucide-react"

const contactInfo = [
  { icon: MapPin, title: "Address", details: ["123 Industrial Road", "Freetown, Sierra Leone"] },
  { icon: Phone, title: "Phone", details: ["+232 76 123 456"] },
  { icon: Mail, title: "Email", details: ["info@wiyonecharcoal.com"] },
  { icon: Clock, title: "Hours", details: ["Mon - Fri: 8AM - 6PM"] },
]

const inquiryTypes = [
  { value: "quote", label: "Request a Quote" },
  { value: "bulk_order", label: "Bulk Order" },
  { value: "partnership", label: "Partnership" },
  { value: "support", label: "Customer Support" },
  { value: "general", label: "General Inquiry" },
]

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    inquiryType: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const supabase = createBrowserClient()

      const { error: insertError } = await supabase.from("contact_inquiries").insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        inquiry_type: formData.inquiryType,
        message: formData.message,
        status: "new",
      })

      if (insertError) throw insertError

      setSubmitted(true)
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        inquiryType: "",
        message: "",
      })
    } catch (err: any) {
      console.error("[v0] Contact form error:", err)
      setError(err.message || "Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">Contact Us</span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl tracking-tight">Get In Touch</h2>
          <p className="mt-3 text-slate-600 text-sm">Have questions? Our team will get back to you promptly.</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
                  <CheckCircle className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Message Sent!</h3>
                <p className="mt-2 text-sm text-slate-500">We will get back to you within 24 hours.</p>
                <Button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 bg-slate-900 text-white hover:bg-slate-800 rounded-full text-sm"
                >
                  Send Another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs text-slate-700">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs text-slate-700">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-slate-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs text-slate-700">
                      Phone (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+232 76 123 456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inquiry" className="text-xs text-slate-700">
                    Inquiry Type *
                  </Label>
                  <Select
                    value={formData.inquiryType}
                    onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                    required
                  >
                    <SelectTrigger className="bg-white border-slate-200 rounded-lg h-10 text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {inquiryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs text-slate-700">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your needs..."
                    rows={3}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="resize-none bg-white border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 rounded-full h-10 text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="grid gap-3 sm:grid-cols-2">
            {contactInfo.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-slate-900 text-sm">{item.title}</h3>
                {item.details.map((detail) => (
                  <p key={detail} className="text-xs text-slate-500">
                    {detail}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
