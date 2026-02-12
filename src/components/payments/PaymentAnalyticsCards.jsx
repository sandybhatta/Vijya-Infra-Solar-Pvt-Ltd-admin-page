import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  Wallet,
  Building2,
  Banknote,
  Receipt
} from 'lucide-react'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export default function PaymentAnalyticsCards({ analytics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardContent className="p-4 md:p-6">
              <Skeleton className="h-4 w-20 bg-white/10 mb-2" />
              <Skeleton className="h-8 w-full bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Payments',
      value: analytics?.totalCount || 0,
      icon: Receipt,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Collected',
      value: formatCurrency(analytics?.totalAmount || 0),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Today',
      value: formatCurrency(analytics?.todayAmount || 0),
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'This Month',
      value: formatCurrency(analytics?.monthAmount || 0),
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      title: 'This Year',
      value: formatCurrency(analytics?.yearAmount || 0),
      icon: Banknote,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Average Payment',
      value: formatCurrency(analytics?.avgAmount || 0),
      icon: Wallet,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Highest Payment',
      value: formatCurrency(analytics?.highestAmount || 0),
      icon: TrendingUp,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10'
    },
    {
      title: 'UPI Payments',
      value: formatCurrency(analytics?.modeBreakdown?.upi || 0),
      icon: CreditCard,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card 
            key={index} 
            className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${card.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-gray-400 font-medium uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-lg md:text-2xl font-black text-white">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
