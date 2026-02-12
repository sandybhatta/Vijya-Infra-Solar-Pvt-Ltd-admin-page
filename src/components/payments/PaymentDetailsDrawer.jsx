import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { X, Edit, Trash2, FileText, User, Building2, CreditCard } from 'lucide-react'
import { PaymentModeBadge, InvoiceStatusBadge } from './PaymentBadges'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export default function PaymentDetailsDrawer({ open, setOpen, payment, onEdit, onDelete }) {
  if (!payment) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="bg-gray-900 border-l border-white/10 text-white w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Payment Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Payment Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-bold uppercase text-sm">Payment Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-green-400 font-bold text-lg">{formatCurrency(payment.paid_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Payment Date</span>
                <span className="text-white">{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Payment Mode</span>
                <PaymentModeBadge mode={payment.payment_mode} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Transaction Ref</span>
                <span className="text-white font-mono text-sm">{payment.transaction_ref || '—'}</span>
              </div>
              {payment.notes && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-gray-400 text-sm block mb-1">Notes</span>
                  <p className="text-white text-sm">{payment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <FileText className="h-5 w-5" />
              <h3 className="font-bold uppercase text-sm">Invoice Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Invoice Number</span>
                <span className="text-blue-400 font-mono">{payment.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Invoice Total</span>
                <span className="text-white font-bold">{formatCurrency(payment.invoice_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Status</span>
                <InvoiceStatusBadge status={payment.invoice_status} />
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="h-5 w-5" />
              <h3 className="font-bold uppercase text-sm">Customer Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Name</span>
                <span className="text-white font-medium">{payment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Phone</span>
                <span className="text-white">{payment.customer_phone}</span>
              </div>
              {payment.customer_email && (
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Email</span>
                  <span className="text-white text-sm">{payment.customer_email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Location</span>
                <span className="text-white">{payment.customer_city}, {payment.customer_state}</span>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Building2 className="h-5 w-5" />
              <h3 className="font-bold uppercase text-sm">Project Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Project Name</span>
                <span className="text-white font-medium">{payment.project_name}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setOpen(false)
                onEdit(payment)
              }}
              className="flex-1 bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                onDelete(payment)
              }}
              variant="outline"
              className="flex-1 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
