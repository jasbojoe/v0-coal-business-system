"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MoreHorizontal, Pencil, Trash2, UserCircle, Phone } from "lucide-react"
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

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-purple-100 text-purple-800",
  production: "bg-blue-100 text-blue-800",
  sales: "bg-green-100 text-green-800",
  delivery: "bg-orange-100 text-orange-800",
}

const departments = ["All", "Management", "Production", "Sales", "Logistics", "Finance"]
const roles = ["All", "admin", "manager", "production", "sales", "delivery"]

export function StaffTable({ staff }: { staff: Staff[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [departmentFilter, setDepartmentFilter] = useState("All")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      member.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      member.department?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "All" || member.role === roleFilter
    const matchesDepartment = departmentFilter === "All" || member.department === departmentFilter
    return matchesSearch && matchesRole && matchesDepartment
  })

  const handleDelete = async () => {
    if (!deleteId) return

    await supabase.from("staff").delete().eq("id", deleteId)
    setDeleteId(null)
    router.refresh()
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from("staff").update({ is_active: !currentStatus }).eq("id", id)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === "All" ? "All Roles" : role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept === "All" ? "All Departments" : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircle className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{member.profile?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[member.role] || "bg-gray-100 text-gray-800"}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{member.department || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {member.phone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/staff/${member.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(member.id, member.is_active)}>
                              {member.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(member.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
