import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  ListTodo,
  Target
} from 'lucide-react'

export default function TasksKPI({ analytics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const kpis = analytics?.kpis || {}

  const cards = [
    {
      title: 'Total Tasks',
      value: kpis.total || 0,
      icon: ListTodo,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Pending',
      value: kpis.pending || 0,
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Completed',
      value: kpis.done || 0,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Cancelled',
      value: kpis.cancelled || 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Overdue',
      value: kpis.overdue || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20'
    },
    {
      title: 'Due Today',
      value: kpis.dueToday || 0,
      icon: Calendar,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Due This Week',
      value: kpis.dueThisWeek || 0,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Completion Rate',
      value: `${kpis.completionRate || 0}%`,
      icon: Target,
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/10'
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
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-3 w-3 md:h-4 md:w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-black text-white">
                {card.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
