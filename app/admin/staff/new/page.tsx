import { StaffForm } from "@/components/admin/staff-form"

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Staff Member</h1>
        <p className="text-muted-foreground">Create a new staff account</p>
      </div>

      <StaffForm />
    </div>
  )
}
