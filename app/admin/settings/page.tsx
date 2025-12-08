import { createServerClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/admin/settings-form"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: companySettings } = await supabase.from("company_settings").select("*").limit(1).single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <SettingsForm user={user} profile={profile} companySettings={companySettings} />
    </div>
  )
}
