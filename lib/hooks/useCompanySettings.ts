"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type CompanySettings = {
  id: string
  company_name: string
  business_email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  website: string | null
  logo_url: string | null
  logo_light_url: string | null
  logo_dark_url: string | null

}

export function useCompanySettings() {
  const supabase = useMemo(() => createClient(), [])
  const [data, setData] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, error } = await supabase
        .from("company_settings")
        .select("id, company_name, business_email, phone, address, city, country, website, logo_url, logo_light_url, logo_dark_url")
        .limit(1)
        .single()

      if (mounted) {
        if (!error && data) setData(data as CompanySettings)
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [supabase])

  return { data, loading }
}

