"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
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
  const [method, setMethod] = useState<string>("cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericAmount = useMemo(() => Number(amount || 0), [amount])
  const canSave = numericAmount > 0 && numericAmount <= balanceDue && !isSaving

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setAmount("")
      setMethod("cash")
      setReference("")
      setNotes("")
      setError(null)
    }
  }

  async function handleSave() {
    setError(null)
    if (!canSave) {
      if (numericAmount <= 0) return setError("Enter an amount greater than 0.")
      if (numericAmount > balanceDue) return setError(`Amount cannot exceed balance due ($${balanceDue.toFixed(2)}).`)
      return
    }

    setIsSaving(true)
    try {
      await recordPayment({
        orderId,
        amount: numericAmount,
        paymentMethod: method,
        reference: reference || null,
        notes: notes || null,
      })
      close(false)
      onRecorded?.()
    } catch (e: any) {
      setError(e?.message || "Failed to record payment.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Record Payment — {orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{error}</div> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">Balance due: ${balanceDue.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference (optional)</Label>
            <Input
              id="reference"
              placeholder="Transaction ID / MoMo ref / Bank ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" placeholder="Anything helpful for the audit trail" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
