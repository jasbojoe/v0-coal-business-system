import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { StaffForm } from "@/components/admin/staff-form"

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    redirect("/admin/staff/new")
  }

  const supabase = await createServerClient()

  const { data: staff } = await supabase
    .from("staff")
    .select(`
      *,
      profile:profiles(full_name, email, avatar_url)
    `)
    .eq("id", id)
    .single()

  if (!staff) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Staff Member</h1>
        <p className="text-muted-foreground">Update staff information and role</p>
      </div>

      <StaffForm staff={staff} />
    </div>
  )
}
