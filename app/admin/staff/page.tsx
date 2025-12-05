import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { StaffTable } from "@/components/admin/staff-table"

export default async function StaffPage() {
  const supabase = await createServerClient()

  const { data: staff } = await supabase
    .from("staff")
    .select(`
      *,
      profile:profiles(full_name, email, avatar_url)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/staff/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Link>
        </Button>
      </div>

      <StaffTable staff={staff || []} />
    </div>
  )
}
