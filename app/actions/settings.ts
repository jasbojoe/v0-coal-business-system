"use server"

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity-logger"
import { revalidatePath } from "next/cache"

interface CompanySettingsData {
  company_name: string
  business_email: string
  phone: string
  address: string
  city: string
  country: string
  website: string
  logo_url: string | null
  logo_light_url?: string | null
  logo_dark_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
}

interface NotificationPreferences {
  email_notifications: boolean
  order_alerts: boolean
  low_stock_alerts: boolean
  weekly_reports: boolean
}

export async function updateCompanySettings(
  settingsId: string | null,
  data: CompanySettingsData
) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const settingsData = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    if (settingsId) {
      // Update existing settings
      const { error } = await supabase
        .from("company_settings")
        .update(settingsData)
        .eq("id", settingsId)

      if (error) throw error

      await logActivity({
        action: "company_settings_updated",
        entityType: "company_settings",
        entityId: settingsId,
        details: {
          company_name: data.company_name,
          business_email: data.business_email,
          phone: data.phone,
        },
        userId: user.id,
      })

      revalidatePath("/admin/settings")
      revalidatePath("/")
      return { success: true, id: settingsId }
    } else {
      // Insert new settings
      const { data: newSettings, error } = await supabase
        .from("company_settings")
        .insert(settingsData)
        .select()
        .single()

      if (error) throw error

      await logActivity({
        action: "company_settings_created",
        entityType: "company_settings",
        entityId: newSettings.id,
        details: {
          company_name: data.company_name,
          business_email: data.business_email,
          phone: data.phone,
        },
        userId: user.id,
      })

      revalidatePath("/admin/settings")
      revalidatePath("/")
      return { success: true, id: newSettings.id }
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update company settings" }
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || user.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Update notification preferences in profiles table
    const { error } = await supabase
      .from("profiles")
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    await logActivity({
      action: "notification_preferences_updated",
      entityType: "profile",
      entityId: userId,
      details: preferences,
      userId: user.id,
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update notification preferences" }
  }
}

export async function updateProfile(
  userId: string,
  data: { full_name: string }
) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || user.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    await logActivity({
      action: "profile_updated",
      entityType: "profile",
      entityId: userId,
      details: { full_name: data.full_name },
      userId: user.id,
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile" }
  }
}
