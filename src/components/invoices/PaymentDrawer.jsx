import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Plus } from 'lucide-react'
import { PaymentStatusBadge, PaymentModeBadge } from './InvoiceBadges'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export default function PaymentDrawer({
  open,
  setOpen,
  invoice,
  payments = [],
  isLoadingPayments,
  onAddPayment,
  onDeletePayment,
  isSubmitting
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletePaymentId, setDeletePaymentId] = useState(null)
  const [formData, setFormData] = useState({
    paid_amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_mode: 'bank_transfer',
    transaction_ref: '',
    notes: ''
  })

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

    if (!formData.payment_mode) {
      toast.error('Please select a payment mode')
      return
    }

    // Prepare data
    const submitData = {
      invoice_id: invoice.id,
      paid_amount: Number(formData.paid_amount),
      payment_date: formData.payment_date,
      payment_mode: formData.payment_mode,
      transaction_ref: formData.transaction_ref || null,
      notes: formData.notes || null
    }

    onAddPayment(submitData, () => {
      // Reset form on success
      setFormData({
        paid_amount: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_mode: 'bank_transfer',
        transaction_ref: '',
        notes: ''
      })
      setShowAddForm(false)
    })
  }

  const handleDelete = () => {
    if (deletePaymentId) {
      onDeletePayment({ id: deletePaymentId, invoice_id: invoice.id }, () => {
        setDeletePaymentId(null)
      })
    }
  }

  if (!invoice) return null

  const totalAmount = Number(invoice.invoice_amount || 0) + Number(invoice.gst_amount || 0)
  const paidAmount = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0
  const pendingAmount = totalAmount - paidAmount

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-gray-900 border-white/10 text-white w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl md:text-2xl font-black text-neon-blue">
              Payment Management
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              Invoice: <span className="font-mono text-white">{invoice.invoice_number}</span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Invoice Summary */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 uppercase font-bold">Customer</span>
                <span className="text-white font-medium">{invoice.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 uppercase font-bold">Total Amount</span>
                <span className="text-white font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 uppercase font-bold">Paid Amount</span>
                <span className="text-green-400 font-bold text-lg">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 uppercase font-bold">Pending Amount</span>
                <span className={`font-black text-xl ${pendingAmount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm text-gray-400 uppercase font-bold">Payment Status</span>
                <PaymentStatusBadge status={invoice.payment_status} />
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Payment History</h3>
                {!showAddForm && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    size="sm"
                    className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                )}
              </div>

              {isLoadingPayments ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-white/10" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No payments recorded yet</p>
                </div>
              ) : (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10">
                        <TableHead className="text-xs font-black uppercase text-gray-400">Date</TableHead>
                        <TableHead className="text-xs font-black uppercase text-gray-400">Amount</TableHead>
                        <TableHead className="text-xs font-black uppercase text-gray-400">Mode</TableHead>
                        <TableHead className="text-xs font-black uppercase text-gray-400">Ref</TableHead>
                        <TableHead className="text-xs font-black uppercase text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(payment => (
                        <TableRow key={payment.id} className="border-white/5">
                          <TableCell className="text-sm text-white">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-green-400">
                            {formatCurrency(payment.paid_amount)}
                          </TableCell>
                          <TableCell>
                            <PaymentModeBadge mode={payment.payment_mode} />
                          </TableCell>
                          <TableCell className="text-sm text-gray-400 font-mono">
                            {payment.transaction_ref || '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletePaymentId(payment.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Add Payment Form */}
            {showAddForm && (
              <div className="bg-white/5 border border-neon-blue/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neon-blue">Add New Payment</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

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

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Payment...
                      </>
                    ) : (
                      'Add Payment'
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove the payment record and recalculate the invoice status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
