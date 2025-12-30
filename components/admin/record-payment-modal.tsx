"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { recordPayment } from "@/app/actions/payments"

export function RecordPaymentModal({
  orderId,
  balanceDue,
  open,
  onClose,
}: {
  orderId: string
  balanceDue: number
  open: boolean
  onClose: () => void
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    if (value > balanceDue) return

    setLoading(true)
    try {
      await recordPayment(orderId, value, method, reference || null, notes || null)
      // ✅ close AFTER successful save
      onClose()
      // optional: reset fields
      setAmount("")
      setMethod("Cash")
      setReference("")
      setNotes("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // ✅ allow closing via X, overlay click, or ESC
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Balance due: <span className="font-medium">${balanceDue.toFixed(2)}</span>
          </div>

          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>

          <Input
            placeholder="Reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
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
