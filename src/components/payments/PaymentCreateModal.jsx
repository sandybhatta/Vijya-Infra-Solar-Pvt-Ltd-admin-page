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
import { useGetInvoicesWithDetailsQuery } from '@/features/finance/financeApi'

export default function PaymentCreateModal({
  open,
  setOpen,
  onSubmit,
  isLoading
}) {
  const [formData, setFormData] = useState({
    invoice_id: '',
    paid_amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_mode: 'upi',
    transaction_ref: '',
    notes: ''
  })

  const { data: invoicesData } = useGetInvoicesWithDetailsQuery({
    page: 1,
    limit: 1000,
    status: '' // Get all invoices
  })

  const invoices = invoicesData?.invoices || []

  useEffect(() => {
    if (open) {
      setFormData({
        invoice_id: '',
        paid_amount: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_mode: 'upi',
        transaction_ref: '',
        notes: ''
      })
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.invoice_id) {
      toast.error('Please select an invoice')
      return
    }

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
      ...formData,
      paid_amount: Number(formData.paid_amount)
    }

    onSubmit(submitData)
  }

  const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Add Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Selection */}
          <div className="space-y-2">
            <Label htmlFor="invoice" className="text-sm font-bold text-gray-400 uppercase">
              Invoice *
            </Label>
            <Select value={formData.invoice_id} onValueChange={(val) => setFormData({ ...formData, invoice_id: val })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                {invoices.map(invoice => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - {invoice.customer_name} - ₹{(Number(invoice.invoice_amount || 0) + Number(invoice.gst_amount || 0)).toLocaleString('en-IN')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInvoice && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Customer: {selectedInvoice.customer_name} • {selectedInvoice.customer_phone}</div>
                <div>Total: ₹{(Number(selectedInvoice.invoice_amount || 0) + Number(selectedInvoice.gst_amount || 0)).toLocaleString('en-IN')} • Pending: ₹{selectedInvoice.pending_amount?.toLocaleString('en-IN')}</div>
              </div>
            )}
          </div>

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
                  Adding...
                </>
              ) : (
                'Add Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
