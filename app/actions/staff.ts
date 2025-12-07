"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface CreateStaffData {
  email: string
  password: string
  full_name: string
  position: string
  department: string
  phone?: string
  hire_date?: string
  salary?: string
  emergency_contact?: string
  emergency_phone?: string
  address?: string
  notes?: string
  status: string
}

interface UpdateStaffData {
  id: string
  full_name: string
  position: string
  department: string
  phone?: string
  hire_date?: string
  salary?: string
  emergency_contact?: string
  emergency_phone?: string
  address?: string
  notes?: string
  status: string
}

export async function createStaff(data: CreateStaffData) {
  try {
    // Validate required fields
    if (!data.email || !data.password) {
      return { error: "Email and password are required" }
    }

    if (data.password.length < 6) {
      return { error: "Password must be at least 6 characters" }
    }

    if (!data.department) {
      return { error: "Department is required" }
    }

    // Step 1: Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: data.full_name,
      },
    })

    if (authError) {
      console.error("[v0] Auth creation error:", authError)
      return { error: `Failed to create user account: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: "Failed to create user account" }
    }

    const userId = authData.user.id

    // Step 2: Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone || null,
      role: data.position === "admin" ? "admin" : "staff",
      is_active: true,
    })

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError)
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { error: `Failed to create profile: ${profileError.message}` }
    }

    // Step 3: Create staff record
    const employeeId = `EMP-${Date.now().toString().slice(-6)}`

    const { error: staffError } = await supabaseAdmin.from("staff").insert({
      profile_id: userId,
      employee_id: employeeId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      position: data.position,
      department: data.department,
      hire_date: data.hire_date || null,
      salary: data.salary ? Number.parseFloat(data.salary) : null,
      emergency_contact: data.emergency_contact || null,
      emergency_phone: data.emergency_phone || null,
      address: data.address || null,
      notes: data.notes || null,
      status: data.status,
    })

    if (staffError) {
      console.error("[v0] Staff creation error:", staffError)
      // Clean up: delete profile and auth user if staff creation fails
      await supabaseAdmin.from("profiles").delete().eq("id", userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { error: `Failed to create staff: ${staffError.message}` }
    }

    revalidatePath("/admin/staff")
    return { success: true, employeeId }
  } catch (err: any) {
    console.error("[v0] Create staff error:", err)
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function updateStaff(data: UpdateStaffData) {
  try {
    if (!data.department) {
      return { error: "Department is required" }
    }

    const { error: staffError } = await supabaseAdmin
      .from("staff")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        position: data.position,
        department: data.department,
        hire_date: data.hire_date || null,
        salary: data.salary ? Number.parseFloat(data.salary) : null,
        emergency_contact: data.emergency_contact || null,
        emergency_phone: data.emergency_phone || null,
        address: data.address || null,
        notes: data.notes || null,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (staffError) {
      console.error("[v0] Staff update error:", staffError)
      return { error: `Failed to update staff: ${staffError.message}` }
    }

    revalidatePath("/admin/staff")
    return { success: true }
  } catch (err: any) {
    console.error("[v0] Update staff error:", err)
    return { error: err.message || "An unexpected error occurred" }
  }
}
