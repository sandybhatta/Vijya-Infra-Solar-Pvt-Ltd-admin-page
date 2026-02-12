import React from 'react'
import { Badge } from '@/components/ui/badge'

export function TaskTypeBadge({ type }) {
  const configs = {
    follow_up: { label: 'Follow Up', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    site_visit: { label: 'Site Visit', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    installation: { label: 'Installation', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    maintenance: { label: 'Maintenance', className: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    call: { label: 'Call', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
  }

  const config = configs[type] || configs.call

  return (
    <Badge variant="outline" className={`text-[10px] md:text-xs font-bold uppercase ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export function TaskStatusBadge({ status }) {
  const configs = {
    pending: { label: 'Pending', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    done: { label: 'Done', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
  }

  const config = configs[status] || configs.pending

  return (
    <Badge variant="outline" className={`text-[10px] md:text-xs font-bold uppercase ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export function TaskPriorityBadge({ priority }) {
  const configs = {
    high: { label: 'High', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    low: { label: 'Low', className: 'bg-green-500/20 text-green-400 border-green-500/30' }
  }

  const config = configs[priority] || configs.low

  return (
    <Badge variant="outline" className={`text-[10px] md:text-xs font-bold ${config.className}`}>
      {config.label}
    </Badge>
  )
}
