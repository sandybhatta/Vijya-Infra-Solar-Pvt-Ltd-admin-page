import React from 'react'
import { format } from 'date-fns'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreVertical, Eye, Edit, Trash2, Receipt, FileText } from 'lucide-react'
import { PaymentStatusBadge, OverdueBadge } from './InvoiceBadges'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

// Mobile Card View
function InvoiceMobileCard({ invoice, onEdit, onDelete, onViewPayments, onPreview, isSelected, onSelect }) {
  return (
    <Card className={`bg-white/5 border-white/10 ${invoice.is_overdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="border-white/20"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold text-sm">{invoice.invoice_number}</span>
                <PaymentStatusBadge status={invoice.payment_status} />
                {invoice.is_overdue && <OverdueBadge />}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
              <DropdownMenuItem onClick={() => onPreview(invoice)} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewPayments(invoice)} className="cursor-pointer">
                <Receipt className="h-4 w-4 mr-2" /> Payments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(invoice)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(invoice)} className="cursor-pointer text-red-400">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer Info */}
        <div className="text-sm">
          <div className="text-white font-medium">{invoice.customer_name}</div>
          <div className="text-gray-500 text-xs">{invoice.customer_phone}</div>
          {invoice.projects?.project_name && (
            <div className="text-blue-400 text-xs mt-1">{invoice.projects.project_name}</div>
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-500">Invoice Amount</div>
            <div className="text-white font-bold">{formatCurrency(invoice.invoice_amount)}</div>
          </div>
          <div>
            <div className="text-gray-500">GST</div>
            <div className="text-white font-bold">{formatCurrency(invoice.gst_amount)}</div>
          </div>
          <div>
            <div className="text-gray-500">Total</div>
            <div className="text-neon-blue font-black">{formatCurrency(invoice.total_amount)}</div>
          </div>
          <div>
            <div className="text-gray-500">Pending</div>
            <div className={`font-bold ${invoice.pending_amount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {formatCurrency(invoice.pending_amount)}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Invoice: {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
          <span className={invoice.is_overdue ? 'text-red-400 font-bold' : ''}>
            Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InvoiceTable({ 
  invoices = [], 
  isLoading, 
  onEdit, 
  onDelete, 
  onViewPayments,
  onPreview,
  selectedInvoices = [],
  onSelectInvoice,
  onSelectAll
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Desktop Skeleton */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                {[...Array(11)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  {[...Array(11)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-white/10" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
        <div className="bg-white/5 p-6 md:p-8 rounded-full mb-4">
          <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-600" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Invoices Found</h3>
        <p className="text-sm md:text-base text-gray-400 mb-4">Create your first invoice to get started</p>
      </div>
    )
  }

  const allSelected = invoices.length > 0 && selectedInvoices.length === invoices.length

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invoices.map(invoice => (
          <InvoiceMobileCard
            key={invoice.id}
            invoice={invoice}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewPayments={onViewPayments}
            onPreview={onPreview}
            isSelected={selectedInvoices.includes(invoice.id)}
            onSelect={() => onSelectInvoice(invoice.id)}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                    className="border-white/20"
                  />
                </TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Invoice #</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Customer</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Project</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400 text-right">Invoice Amt</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400 text-right">GST</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400 text-right">Total</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400 text-right">Paid</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400 text-right">Pending</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Status</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Dates</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow 
                  key={invoice.id} 
                  className={`border-white/5 ${invoice.is_overdue ? 'bg-red-900/10' : ''}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={() => onSelectInvoice(invoice.id)}
                      className="border-white/20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-neon-blue font-bold">
                      {invoice.invoice_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-white">{invoice.customer_name}</div>
                      <div className="text-xs text-gray-500">{invoice.customer_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-blue-400">
                      {invoice.projects?.project_name || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm text-white">{formatCurrency(invoice.invoice_amount)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm text-white">{formatCurrency(invoice.gst_amount)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm font-bold text-neon-blue">{formatCurrency(invoice.total_amount)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm text-green-400">{formatCurrency(invoice.paid_amount)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`text-sm font-bold ${invoice.pending_amount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                      {formatCurrency(invoice.pending_amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <PaymentStatusBadge status={invoice.payment_status} />
                      {invoice.is_overdue && <OverdueBadge />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="text-white">Inv: {format(new Date(invoice.invoice_date), 'MMM dd, yy')}</div>
                      <div className={invoice.is_overdue ? 'text-red-400 font-bold' : 'text-gray-500'}>
                        Due: {format(new Date(invoice.due_date), 'MMM dd, yy')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={() => onPreview(invoice)} className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewPayments(invoice)} className="cursor-pointer">
                          <Receipt className="h-4 w-4 mr-2" /> Payments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(invoice)} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(invoice)} className="cursor-pointer text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
