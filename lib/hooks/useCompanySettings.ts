"use client"

import { useEffect, useState } from "react"
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
}

export function useCompanySettings() {
  const supabase = createClient()
  const [data, setData] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single()

      if (!error && mounted) setData(data)
      if (mounted) setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [supabase])

  return { data, loading }
}
