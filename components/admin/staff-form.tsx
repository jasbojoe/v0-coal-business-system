"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface Staff {
  id: string
  user_id: string | null
  role: string
  department: string | null
  hire_date: string | null
  salary: number | null
  is_active: boolean
  phone: string | null
  emergency_contact: string | null
  profile: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "production", label: "Production" },
  { value: "sales", label: "Sales" },
  { value: "delivery", label: "Delivery" },
]

const departments = ["Management", "Production", "Sales", "Logistics", "Finance", "Customer Service"]

export function StaffForm({ staff }: { staff?: Staff }) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    email: staff?.profile?.email || "",
    full_name: staff?.profile?.full_name || "",
    role: staff?.role || "sales",
    department: staff?.department || "",
    phone: staff?.phone || "",
    hire_date: staff?.hire_date || new Date().toISOString().split("T")[0],
    salary: staff?.salary?.toString() || "",
    emergency_contact: staff?.emergency_contact || "",
    is_active: staff?.is_active ?? true,
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (staff) {
        // Update existing staff
        const { error: staffError } = await supabase
          .from("staff")
          .update({
            role: formData.role,
            department: formData.department || null,
            phone: formData.phone || null,
            hire_date: formData.hire_date || null,
            salary: formData.salary ? Number.parseFloat(formData.salary) : null,
            emergency_contact: formData.emergency_contact || null,
            is_active: formData.is_active,
          })
          .eq("id", staff.id)

        if (staffError) throw staffError

        // Update profile if user exists
        if (staff.user_id) {
          await supabase.from("profiles").update({ full_name: formData.full_name }).eq("id", staff.user_id)
        }
      } else {
        // Create new staff - first create user account
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required for new staff members")
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
            data: {
              full_name: formData.full_name,
            },
          },
        })

        if (authError) throw authError

        if (authData.user) {
          // Create staff record
          const { error: staffError } = await supabase.from("staff").insert({
            user_id: authData.user.id,
            role: formData.role,
            department: formData.department || null,
            phone: formData.phone || null,
            hire_date: formData.hire_date || null,
            salary: formData.salary ? Number.parseFloat(formData.salary) : null,
            emergency_contact: formData.emergency_contact || null,
            is_active: formData.is_active,
          })

          if (staffError) throw staffError
        }
      }

      router.push("/admin/staff")
      router.refresh()
    } catch (err: any) {
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
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="Name and phone number"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
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

            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">Inactive staff cannot access the system</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
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
