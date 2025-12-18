"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type ActivityLog = {
  id: string
  created_at: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  profiles?: {
    full_name: string | null
    email: string
  } | null
}

const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const

function sinceISO(range: (typeof DATE_FILTERS)[number]["value"]) {
  const now = new Date()
  if (range === "24h") now.setHours(now.getHours() - 24)
  else if (range === "7d") now.setDate(now.getDate() - 7)
  else if (range === "30d") now.setDate(now.getDate() - 30)
  else return null
  return now.toISOString()
}

export default function ActivityPage() {
  const supabase = useMemo(() => createClient(), [])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]["value"]>("7d")

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [logs])

  const uniqueEntities = useMemo(() => {
    const set = new Set(logs.map((l) => l.entity_type).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [logs])

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr) throw authErr
      if (!authData?.user) throw new Error("Not authenticated.")

      let query = supabase
        .from("activity_logs")
        .select(
          `
          id,
          created_at,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          profiles:profiles ( full_name, email )
        `
        )
        .order("created_at", { ascending: false })
        .limit(200)

      const since = sinceISO(dateFilter)
      if (since) query = query.gte("created_at", since)

      const { data, error } = await query
      if (error) throw error

      setLogs((data || []) as ActivityLog[])
    } catch (e: any) {
      setError(e?.message || "Failed to load activity logs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await load()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]) // reload when date range changes

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.action !== actionFilter) return false
      if (entityFilter !== "all" && l.entity_type !== entityFilter) return false

      if (!s) return true

      const who = `${l.profiles?.full_name ?? ""} ${l.profiles?.email ?? ""}`.toLowerCase()
      const blob = [
        l.action,
        l.entity_type,
        l.entity_id ?? "",
        l.user_id ?? "",
        who,
        JSON.stringify(l.details ?? {}),
      ]
        .join(" ")
        .toLowerCase()

      return blob.includes(s)
    })
  }, [logs, q, actionFilter, entityFilter])

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const entityLink = (l: ActivityLog) => {
    // Only add links where you already have admin pages
    if (l.entity_type === "order" && l.entity_id) return `/admin/orders/${l.entity_id}`
    if (l.entity_type === "product" && l.entity_id) return `/admin/products/${l.entity_id}`
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">Recent admin actions and system events.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[280px]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs..." />
          </div>

          <div className="w-full sm:w-[180px]">
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">Filter: Action</div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {uniqueActions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">Filter: Entity</div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {uniqueEntities.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No logs found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((l) => {
                const link = entityLink(l)
                const whoLabel =
                  l.profiles?.full_name?.trim() ||
                  l.profiles?.email ||
                  (l.user_id ? l.user_id : "system")

                return (
                  <div key={l.id} className="rounded-md border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{l.action}</Badge>

                        <span className="text-sm text-muted-foreground">
                          {l.entity_type}
                          {l.entity_id ? " • " : ""}
                          {link ? (
                            <Link className="underline underline-offset-4" href={link}>
                              {l.entity_id}
                            </Link>
                          ) : (
                            l.entity_id ?? ""
                          )}
                        </span>

                        <span className="text-xs text-muted-foreground">by {whoLabel}</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExpanded(l.id)}
                      >
                        {expanded[l.id] ? "Hide details" : "Show details"}
                      </Button>
                    </div>

                    {expanded[l.id] && l.details ? (
                      <pre className="mt-2 max-h-56 overflow-auto rounded bg-slate-950 p-2 text-xs text-slate-100">
{JSON.stringify(l.details, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
