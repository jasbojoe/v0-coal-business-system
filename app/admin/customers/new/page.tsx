import { CustomerForm } from "@/components/admin/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Add New Customer</h1>
        <p className="text-muted-foreground">Add a new customer to your database</p>
      </div>

      <CustomerForm />
    </div>
  )
}
