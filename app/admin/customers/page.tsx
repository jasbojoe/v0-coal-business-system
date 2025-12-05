import { createClient } from "@/lib/supabase/server"
import { CustomersTable } from "@/components/admin/customers-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link href="/admin/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      <CustomersTable customers={customers || []} />
    </div>
  )
}
