import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AdminSidebar user={user} profile={profile} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
