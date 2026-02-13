import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, TrendingUp, AlertCircle, Zap } from 'lucide-react'

export default function BusinessInsights({ stats, isLoading }) {
  if (isLoading) return null

  const insights = [
    {
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      text: `Potential profit locked in inventory is ₹${stats?.potentialProfit?.toLocaleString('en-IN') || 0}`
    },
    {
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      text: stats?.lowStockItems > 0 ? `${stats.lowStockItems} critical materials need immediate reordering.` : 'All stock levels are currently healthy.'
    },
    {
      icon: AlertCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      text: `Total assets value: ₹${stats?.totalCostValue?.toLocaleString('en-IN') || 0} (at cost).`
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.map((insight, i) => (
        <Card key={i} className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${insight.bg}`}>
              <insight.icon className={`h-5 w-5 ${insight.color}`} />
            </div>
            <p className="text-sm font-medium text-gray-200">{insight.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
