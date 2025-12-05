import { createServerClient } from "@/lib/supabase/server"
import { InquiriesTable } from "@/components/admin/inquiries-table"

export default async function InquiriesPage() {
  const supabase = await createServerClient()

  const { data: inquiries } = await supabase
    .from("contact_inquiries")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact Inquiries</h1>
        <p className="text-muted-foreground">Manage customer inquiries and messages</p>
      </div>

      <InquiriesTable inquiries={inquiries || []} />
    </div>
  )
}
