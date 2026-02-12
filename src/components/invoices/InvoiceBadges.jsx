import React from 'react'
import { Badge } from '@/components/ui/badge'

export function PaymentStatusBadge({ status }) {
  const configs = {
    pending: { label: 'Pending', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    partial: { label: 'Partial', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    paid: { label: 'Paid', className: 'bg-green-500/20 text-green-400 border-green-500/30' }
  }

  const config = configs[status] || configs.pending

  return (
    <Badge variant="outline" className={`text-[10px] md:text-xs font-bold uppercase ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export function OverdueBadge() {
  return (
    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] md:text-xs font-bold uppercase">
      OVERDUE
    </Badge>
  )
}

export function PaymentModeBadge({ mode }) {
  const configs = {
    upi: { label: 'UPI', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    bank_transfer: { label: 'Bank Transfer', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    cash: { label: 'Cash', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    cheque: { label: 'Cheque', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    online: { label: 'Online', className: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    other: { label: 'Other', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
  }

  const config = configs[mode] || configs.other

  return (
    <Badge variant="outline" className={`text-[10px] md:text-xs font-bold ${config.className}`}>
      {config.label}
    </Badge>
  )
}
