import React from 'react'
import { Badge } from '@/components/ui/badge'

export function PaymentModeBadge({ mode }) {
  const modeConfig = {
    upi: {
      label: 'UPI',
      className: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    bank_transfer: {
      label: 'Bank Transfer',
      className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    cash: {
      label: 'Cash',
      className: 'bg-green-500/20 text-green-300 border-green-500/30'
    },
    cheque: {
      label: 'Cheque',
      className: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    },
    online: {
      label: 'Online',
      className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    other: {
      label: 'Other',
      className: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const config = modeConfig[mode] || modeConfig.other

  return (
    <Badge className={`text-xs font-bold ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export function InvoiceStatusBadge({ status }) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    },
    partial: {
      label: 'Partial',
      className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    paid: {
      label: 'Paid',
      className: 'bg-green-500/20 text-green-300 border-green-500/30'
    }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge className={`text-xs font-bold ${config.className}`}>
      {config.label}
    </Badge>
  )
}
