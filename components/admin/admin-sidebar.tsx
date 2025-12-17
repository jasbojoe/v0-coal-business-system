"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  UserCog,
  BarChart3,
  Settings,
  ChevronLeft,
  MessageSquare,
  Activity,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  role: string
}

interface AdminSidebarProps {
  user: User
  profile: Profile | null
}

const LOGO_WHITE = "/images/wiyone-logo-blacktext.svg"
const FIRE_ICON = "/images/fireforvector.svg"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", color: "from-violet-500 to-purple-600" },
  { href: "/admin/products", icon: Package, label: "Products", color: "from-blue-500 to-cyan-500" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders", color: "from-emerald-500 to-teal-500" },
  { href: "/admin/customers", icon: Users, label: "Customers", color: "from-orange-500 to-amber-500" },
  { href: "/admin/inventory", icon: Warehouse, label: "Inventory", color: "from-rose-500 to-pink-500" },
  { href: "/admin/staff", icon: UserCog, label: "Staff", color: "from-indigo-500 to-blue-500" },
  { href: "/admin/inquiries", icon: MessageSquare, label: "Inquiries", color: "from-teal-500 to-emerald-500" },

  // ✅ NEW
  { href: "/admin/activity", icon: Activity, label: "Activity Logs", color: "from-sky-500 to-blue-600" },

  { href: "/admin/reports", icon: BarChart3, label: "Reports", color: "from-fuchsia-500 to-pink-500" },
  { href: "/admin/settings", icon: Settings, label: "Settings", color: "from-slate-500 to-slate-600" },
]

export function AdminSidebar({ user, profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        onClick={() => setCollapsed(true)}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-slate-900 transition-all duration-300 lg:relative lg:z-auto",
          collapsed ? "-translate-x-full lg:w-20 lg:translate-x-0" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            {collapsed ? (
              <Image src={FIRE_ICON || "/placeholder.svg"} alt="Wiyone" width={32} height={32} unoptimized />
            ) : (
              <Image
                src={LOGO_WHITE || "/placeholder.svg"}
                alt="Wiyone"
                width={120}
                height={60}
                className="h-10 w-auto"
                unoptimized
              />
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:block transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg",
                    item.color,
                    isActive ? "shadow-lg" : "opacity-90",
                  )}
                >
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        {!collapsed && (
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-semibold text-white">
                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{profile?.full_name || "User"}</p>
                <p className="truncate text-xs text-slate-400">{profile?.role || "Staff"}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setCollapsed(false)}
        className={cn(
          "fixed left-4 top-4 z-30 rounded-xl bg-slate-900 p-2.5 shadow-lg lg:hidden",
          !collapsed && "hidden",
        )}
      >
        <LayoutDashboard className="h-5 w-5 text-white" />
      </button>
    </>
  )
}
