import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PaymentEditModal({
  open,
  setOpen,
  payment,
  onSubmit,
  isLoading
}) {
  const [formData, setFormData] = useState({
    paid_amount: '',
    payment_date: '',
    payment_mode: 'upi',
    transaction_ref: '',
    notes: ''
  })

  useEffect(() => {
    if (open && payment) {
      setFormData({
        paid_amount: payment.paid_amount || '',
        payment_date: payment.payment_date || '',
        payment_mode: payment.payment_mode || 'upi',
        transaction_ref: payment.transaction_ref || '',
        notes: payment.notes || ''
      })
    }
  }, [open, payment])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.paid_amount || Number(formData.paid_amount) <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }

    if (!formData.payment_date) {
      toast.error('Please select a payment date')
      return
    }

    if (formData.payment_date > format(new Date(), 'yyyy-MM-dd')) {
      toast.error('Payment date cannot be in the future')
      return
    }

    if (!formData.payment_mode) {
      toast.error('Please select a payment mode')
      return
    }

    const submitData = {
      id: payment.id,
      invoice_id: payment.invoice_id,
      ...formData,
      paid_amount: Number(formData.paid_amount)
    }

    onSubmit(submitData)
  }

  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Edit Payment
          </DialogTitle>
          <div className="text-sm text-gray-400">
            Invoice: {payment.invoice_number} • Customer: {payment.customer_name}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paid_amount" className="text-sm font-bold text-gray-400 uppercase">
                Amount (₹) *
              </Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date" className="text-sm font-bold text-gray-400 uppercase">
                Payment Date *
              </Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label htmlFor="payment_mode" className="text-sm font-bold text-gray-400 uppercase">
              Payment Mode *
            </Label>
            <Select
              value={formData.payment_mode}
              onValueChange={(val) => setFormData({ ...formData, payment_mode: val })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Reference */}
          <div className="space-y-2">
            <Label htmlFor="transaction_ref" className="text-sm font-bold text-gray-400 uppercase">
              Transaction Reference
            </Label>
            <Input
              id="transaction_ref"
              value={formData.transaction_ref}
              onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
              placeholder="UPI ID, Cheque #, Transaction ID, etc."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-bold text-gray-400 uppercase">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
              className="bg-white/5 border-white/10 text-white resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
