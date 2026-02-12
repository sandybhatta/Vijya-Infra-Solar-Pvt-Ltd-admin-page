import React from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreVertical, Eye, Edit, Trash2, FileText } from 'lucide-react'
import { PaymentModeBadge, InvoiceStatusBadge } from './PaymentBadges'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

// Mobile Card View
function PaymentMobileCard({ payment, onEdit, onDelete, onViewDetails, isSelected, onSelect }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="border-white/20"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold text-sm">{formatCurrency(payment.paid_amount)}</span>
                <PaymentModeBadge mode={payment.payment_mode} />
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
              <DropdownMenuItem onClick={() => onViewDetails(payment)} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(payment)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(payment)} className="cursor-pointer text-red-400">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-sm">
          <div className="text-white font-medium">{payment.customer_name}</div>
          <div className="text-gray-500 text-xs">{payment.customer_phone}</div>
          <div className="text-blue-400 text-xs mt-1">Invoice: {payment.invoice_number}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-500">Date</div>
            <div className="text-white">{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</div>
          </div>
          <div>
            <div className="text-gray-500">Ref</div>
            <div className="text-white font-mono">{payment.transaction_ref || '—'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PaymentTable({
  payments = [],
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  selectedPayments = [],
  onSelectPayment,
  onSelectAll
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
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
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                {[...Array(10)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  {[...Array(10)].map((_, j) => (
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

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
        <div className="bg-white/5 p-6 md:p-8 rounded-full mb-4">
          <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-600" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Payments Found</h3>
        <p className="text-sm md:text-base text-gray-400 mb-4">Record your first payment to get started</p>
      </div>
    )
  }

  const allSelected = payments.length > 0 && selectedPayments.length === payments.length

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {payments.map(payment => (
          <PaymentMobileCard
            key={payment.id}
            payment={payment}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            isSelected={selectedPayments.includes(payment.id)}
            onSelect={() => onSelectPayment(payment.id)}
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
                <TableHead className="text-xs font-black uppercase text-gray-400">Date</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Mode</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Ref</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Invoice</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Customer</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Project</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Status</TableHead>
                <TableHead className="text-xs font-black uppercase text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id} className="border-white/5">
                  <TableCell>
                    <Checkbox
                      checked={selectedPayments.includes(payment.id)}
                      onCheckedChange={() => onSelectPayment(payment.id)}
                      className="border-white/20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm font-bold text-green-400">
                      {formatCurrency(payment.paid_amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PaymentModeBadge mode={payment.payment_mode} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-400 font-mono">
                      {payment.transaction_ref || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-blue-400 font-mono">
                      {payment.invoice_number}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total: {formatCurrency(payment.invoice_total)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-white">{payment.customer_name}</div>
                      <div className="text-xs text-gray-500">{payment.customer_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{payment.project_name}</div>
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={payment.invoice_status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={() => onViewDetails(payment)} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(payment)} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(payment)} className="cursor-pointer text-red-400">
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
