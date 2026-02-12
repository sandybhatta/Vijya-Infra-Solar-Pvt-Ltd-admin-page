import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  XCircle
} from 'lucide-react'

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export default function InvoiceAnalyticsCards({ analytics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const kpis = analytics?.kpis || {}

  const cards = [
    {
      title: 'Total Invoices',
      value: kpis.total_invoices || 0,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      format: 'number'
    },
    {
      title: 'Total Revenue',
      value: kpis.total_revenue || 0,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      format: 'currency'
    },
    {
      title: 'Total Collected',
      value: kpis.total_collected || 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      format: 'currency'
    },
    {
      title: 'Total Pending',
      value: kpis.total_pending || 0,
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      format: 'currency'
    },
    {
      title: 'Pending',
      value: kpis.pending_count || 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      format: 'number',
      subtitle: 'invoices'
    },
    {
      title: 'Partial',
      value: kpis.partial_count || 0,
      icon: Circle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      format: 'number',
      subtitle: 'invoices'
    },
    {
      title: 'Paid',
      value: kpis.paid_count || 0,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      format: 'number',
      subtitle: 'invoices'
    },
    {
      title: 'Overdue',
      value: kpis.overdue_count || 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      format: 'number',
      subtitle: 'invoices'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const displayValue = card.format === 'currency' 
          ? formatCurrency(card.value)
          : card.value.toLocaleString()

        return (
          <Card 
            key={index} 
            className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-3 w-3 md:h-4 md:w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-black text-white">
                {displayValue}
              </div>
              {card.subtitle && (
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
