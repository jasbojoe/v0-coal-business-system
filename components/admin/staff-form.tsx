"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { createStaff, updateStaff } from "@/app/actions/staff"

interface Staff {
  id: string
  profile_id: string | null
  employee_id: string | null
  full_name: string
  email: string
  phone: string | null
  department: string | null
  position: string
  status: string
  hire_date: string | null
  salary: number | null
  emergency_contact: string | null
  emergency_phone: string | null
  address: string | null
  notes: string | null
}

const positions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operator" },
  { value: "driver", label: "Driver" },
  { value: "accountant", label: "Accountant" },
  { value: "sales_rep", label: "Sales Representative" },
]

const departments = [
  { value: "production", label: "Production" },
  { value: "sales", label: "Sales" },
  { value: "logistics", label: "Logistics" },
  { value: "administration", label: "Administration" },
  { value: "management", label: "Management" },
]

const statuses = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
]

export function StaffForm({ staff }: { staff?: Staff }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    email: staff?.email || "",
    full_name: staff?.full_name || "",
    position: staff?.position || "operator",
    department: staff?.department || "production",
    phone: staff?.phone || "",
    hire_date: staff?.hire_date || new Date().toISOString().split("T")[0],
    salary: staff?.salary?.toString() || "",
    emergency_contact: staff?.emergency_contact || "",
    emergency_phone: staff?.emergency_phone || "",
    address: staff?.address || "",
    notes: staff?.notes || "",
    status: staff?.status || "active",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (staff) {
        // Update existing staff using server action
        const result = await updateStaff({
          id: staff.id,
          full_name: formData.full_name,
          position: formData.position,
          department: formData.department,
          phone: formData.phone,
          hire_date: formData.hire_date,
          salary: formData.salary,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
          address: formData.address,
          notes: formData.notes,
          status: formData.status,
        })

        if (result.error) {
          throw new Error(result.error)
        }
      } else {
        // Create new staff using server action
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required for new staff members")
        }

        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }

        const result = await createStaff({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          position: formData.position,
          department: formData.department,
          phone: formData.phone,
          hire_date: formData.hire_date,
          salary: formData.salary,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
          address: formData.address,
          notes: formData.notes,
          status: formData.status,
        })

        if (result.error) {
          throw new Error(result.error)
        }
      }

      router.push("/admin/staff")
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Staff form error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/staff">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-muted-foreground">Back to Staff</span>
      </div>

      {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!staff}
              />
              {staff && <p className="text-xs text-muted-foreground">Email cannot be changed after creation</p>}
            </div>

            {!staff && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Emergency Phone</Label>
                <Input
                  id="emergency_phone"
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary (Monthly)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Inactive staff cannot access the system</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/staff">Cancel</Link>
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {staff ? "Update Staff" : "Create Staff"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
