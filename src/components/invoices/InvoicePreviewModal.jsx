import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, Copy } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import { PaymentStatusBadge } from './InvoiceBadges'

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0)
}

export default function InvoicePreviewModal({ 
  open, 
  setOpen, 
  invoice,
  businessSettings = {}
}) {
  const previewRef = useRef(null)

  if (!invoice) return null

  const totalAmount = Number(invoice.invoice_amount || 0) + Number(invoice.gst_amount || 0)

  const handlePrint = () => {
    window.print()
    toast.success('Opening print dialog...')
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    
    // Company Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(businessSettings.company_name || 'Solar Business Admin', 20, 20)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(businessSettings.company_address || '', 20, 28)
    doc.text(`Email: ${businessSettings.company_email || ''}`, 20, 34)
    doc.text(`Phone: ${businessSettings.company_phone || ''}`, 20, 40)
    
    // Invoice Title
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 150, 20)
    
    // Invoice Details
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice #: ${invoice.invoice_number}`, 150, 30)
    doc.text(`Date: ${format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}`, 150, 36)
    doc.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}`, 150, 42)
    
    // Customer Details
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 20, 60)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.customer_name || '', 20, 68)
    doc.text(invoice.customer_phone || '', 20, 74)
    if (invoice.projects?.project_name) {
      doc.text(`Project: ${invoice.projects.project_name}`, 20, 80)
    }
    
    // Amount Table
    const startY = 100
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 20, startY)
    doc.text('Amount', 170, startY)
    
    doc.setFont('helvetica', 'normal')
    doc.text('Invoice Amount', 20, startY + 10)
    doc.text(formatCurrency(invoice.invoice_amount), 170, startY + 10)
    
    doc.text('GST Amount', 20, startY + 20)
    doc.text(formatCurrency(invoice.gst_amount), 170, startY + 20)
    
    // Total
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total Amount', 20, startY + 35)
    doc.text(formatCurrency(totalAmount), 170, startY + 35)
    
    // Payment Status
    doc.setFontSize(10)
    doc.text(`Payment Status: ${invoice.payment_status?.toUpperCase()}`, 20, startY + 50)
    
    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Thank you for your business!', 20, 280)
    
    doc.save(`${invoice.invoice_number}.pdf`)
    toast.success('PDF downloaded successfully!')
  }

  const handleCopySummary = () => {
    const summary = `
Invoice: ${invoice.invoice_number}
Customer: ${invoice.customer_name}
Project: ${invoice.projects?.project_name || 'N/A'}
Invoice Amount: ${formatCurrency(invoice.invoice_amount)}
GST Amount: ${formatCurrency(invoice.gst_amount)}
Total Amount: ${formatCurrency(totalAmount)}
Payment Status: ${invoice.payment_status}
Invoice Date: ${format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}
    `.trim()

    navigator.clipboard.writeText(summary)
    toast.success('Invoice summary copied to clipboard!')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Invoice Preview
          </DialogTitle>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            size="sm"
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handleCopySummary}
            size="sm"
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Summary
          </Button>
        </div>

        {/* Invoice Document */}
        <div 
          ref={previewRef}
          className="bg-white text-black p-8 md:p-12 rounded-lg space-y-6 print:p-12"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-300 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                {businessSettings.company_name || 'Solar Business Admin'}
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                {businessSettings.company_address || ''}
              </p>
              <p className="text-sm text-gray-600">
                Email: {businessSettings.company_email || ''}
              </p>
              <p className="text-sm text-gray-600">
                Phone: {businessSettings.company_phone || ''}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">INVOICE</h2>
              <p className="text-sm text-gray-600 mt-2 font-mono">{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Invoice & Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-black text-gray-500 uppercase mb-2">Bill To</h3>
              <p className="text-lg font-bold text-gray-900">{invoice.customer_name}</p>
              <p className="text-sm text-gray-600">{invoice.customer_phone}</p>
              {invoice.customer_city && invoice.customer_state && (
                <p className="text-sm text-gray-600">
                  {invoice.customer_city}, {invoice.customer_state}
                </p>
              )}
              {invoice.projects?.project_name && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-bold">Project:</span> {invoice.projects.project_name}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-500">Invoice Date:</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-500">Due Date:</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-bold text-gray-500">Status:</span>
                  <PaymentStatusBadge status={invoice.payment_status} />
                </div>
              </div>
            </div>
          </div>

          {/* Amount Breakdown Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3 text-sm font-black text-gray-700 uppercase">Description</th>
                  <th className="text-right p-3 text-sm font-black text-gray-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="p-3 text-gray-900">Invoice Amount</td>
                  <td className="p-3 text-right text-gray-900 font-medium">
                    {formatCurrency(invoice.invoice_amount)}
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-3 text-gray-900">GST Amount</td>
                  <td className="p-3 text-right text-gray-900 font-medium">
                    {formatCurrency(invoice.gst_amount)}
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="p-3 text-lg font-black text-gray-900">Total Amount</td>
                  <td className="p-3 text-right text-xl font-black text-gray-900">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Info */}
          {invoice.paid_amount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-green-700">Paid Amount:</span>
                <span className="text-lg font-black text-green-700">
                  {formatCurrency(invoice.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-bold text-orange-700">Pending Amount:</span>
                <span className="text-lg font-black text-orange-700">
                  {formatCurrency(invoice.pending_amount)}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 text-center">
            <p className="text-sm text-gray-600 italic">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              Generated on {format(new Date(), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
