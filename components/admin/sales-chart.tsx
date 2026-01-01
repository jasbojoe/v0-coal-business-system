"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Row = { amount: number; payment_date: string | null }
type Point = { month: string; netRevenue: number }

function safeNumber(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export function SalesChart() {
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setErr(null)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payments")
        .select("amount,payment_date")
        .order("payment_date", { ascending: true })

      if (error) {
        setErr(error.message)
        setRows([])
        return
      }

      setRows(
        (data || []).map((r: any) => ({
          amount: safeNumber(r.amount),
          payment_date: r.payment_date ?? null,
        })),
      )
    }

    run()
  }, [])

  const data: Point[] = useMemo(() => {
    const map = new Map<string, number>()

    for (const r of rows) {
      if (!r.payment_date) continue
      const d = new Date(r.payment_date)
      if (Number.isNaN(d.getTime())) continue

      const label = d.toLocaleString(undefined, { month: "short", year: "numeric" })
      map.set(label, (map.get(label) || 0) + safeNumber(r.amount))
    }

    return Array.from(map.entries()).map(([month, netRevenue]) => ({ month, netRevenue }))
  }, [rows])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Revenue Overview</CardTitle>
        <CardDescription>Payments collected minus refunds (monthly)</CardDescription>
      </CardHeader>

      <CardContent>
        {err ? (
          <div className="text-sm text-red-600">Failed to load sales chart: {err}</div>
        ) : (
          <div className="h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.3} />
                    <stop offset="95%" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `Le ${safeNumber(v).toLocaleString()}`} />
                <Tooltip
                  formatter={(value: any) => [`Le ${safeNumber(value).toLocaleString()}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />

                <Area type="monotone" dataKey="sales" strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SalesChart
