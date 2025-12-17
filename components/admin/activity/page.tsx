import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ActivityPage() {
  const supabase = createClient()

  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select("id, created_at, user_id, action, entity_type, entity_id, details")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">Recent admin actions and system events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600">{error.message}</div>
          ) : !logs?.length ? (
            <div className="text-sm text-muted-foreground">No logs yet.</div>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-medium">{l.action}</div>
                    <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{l.entity_type}</span>{" "}
                    <span className="break-all">{l.entity_id}</span>
                  </div>

                  {l.details ? (
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-950 p-2 text-xs text-slate-100">
{JSON.stringify(l.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
