import { createClient } from "@/lib/supabase/server"
import { CustomerForm } from "@/components/admin/customer-form"
import { notFound } from "next/navigation"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Edit Customer</h1>
        <p className="text-muted-foreground">Update customer information</p>
      </div>

      <CustomerForm customer={customer} />
    </div>
  )
}
