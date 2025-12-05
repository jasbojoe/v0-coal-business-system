"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, User, Settings, Search, ChevronRight } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  role: string
}

interface AdminHeaderProps {
  user: SupabaseUser
  profile: Profile | null
}

const getPageTitle = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 1) return "Dashboard"
  const page = segments[segments.length - 1]
  return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, " ")
}

export function AdminHeader({ user, profile }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Admin</span>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <h2 className="text-sm font-semibold text-slate-900">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs outline-none placeholder:text-slate-400 w-40"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9 hover:bg-slate-100">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 rounded-lg hover:bg-slate-100 h-9">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-semibold text-white">
                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-medium text-slate-700">{profile?.full_name || "User"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-slate-900 text-sm">{profile?.full_name || "User"}</span>
                <span className="text-xs font-normal text-slate-500">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer text-xs">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer text-xs">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-rose-600 focus:text-rose-600 rounded-lg cursor-pointer text-xs"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
