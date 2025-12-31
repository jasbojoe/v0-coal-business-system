"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { recordPayment } from "@/app/actions/payments"

export function RecordPaymentModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  balanceDue,
  onRecorded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  balanceDue: number
  onRecorded?: () => void
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const close = () => onOpenChange(false)

  async function submit() {
    setErr(null)
    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0) return setErr("Enter a valid amount.")
    if (value > balanceDue) return setErr(`Amount cannot exceed $${balanceDue.toFixed(2)}.`)

    setLoading(true)
    try {
      await recordPayment(orderId, value, method, reference || null, notes || null)
      onRecorded?.()
      close()
      setAmount("")
      setMethod("Cash")
      setReference("")
      setNotes("")
    } catch (e: any) {
      setErr(e?.message || "Failed to record payment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment — Order {orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Balance due: <span className="font-medium">${balanceDue.toFixed(2)}</span>
          </div>

          {err ? <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{err}</div> : null}

          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select className="w-full rounded border bg-background px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>

          <Input placeholder="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={loading}>
              Close
            </Button>
            <Button type="button" onClick={submit} disabled={loading}>
              {loading ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
