import React, { useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Zap, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Briefcase
} from 'lucide-react'
import { clsx } from 'clsx'
import { subMonths, isSameMonth, parseISO } from 'date-fns'

const KPICard = ({ title, value, icon: Icon, trend, subtext, isLoading, colorClass }) => {
  if (isLoading) {
    return (
      <Card className="bg-glass-bg border-glass-border overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
            <Skeleton className="h-4 w-16 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-24 mb-2 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group bg-glass-bg border-glass-border hover:border-neon-blue/40 transition-all duration-300 relative overflow-hidden">
      <div className={clsx("absolute top-0 left-0 w-full h-1 opacity-50", colorClass)} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={clsx("p-2 rounded-lg bg-white/5", colorClass.replace('bg-', 'text-'))}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <div className={clsx(
              "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
              trend >= 0 ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
            )}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
          {subtext && <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectKPIs({ stats, isLoading }) {
  const kpis = useMemo(() => {
    if (!stats || isLoading) return []

    const { projects = [], payments = [], expenses = [], matCosts = [] } = stats
    
    const now = new Date()
    const lastMonth = subMonths(now, 1)

    // Helper to calculate totals and growth
    const getMetrics = (items, dateKey, valueKey = null) => {
      const currentMonthItems = items.filter(i => isSameMonth(parseISO(i[dateKey]), now))
      const lastMonthItems = items.filter(i => isSameMonth(parseISO(i[dateKey]), lastMonth))
      
      const currentTotal = valueKey 
        ? currentMonthItems.reduce((s, i) => s + Number(i[valueKey] || 0), 0)
        : currentMonthItems.length
        
      const lastTotal = valueKey
        ? lastMonthItems.reduce((s, i) => s + Number(i[valueKey] || 0), 0)
        : lastMonthItems.length

      const growth = lastTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((currentTotal - lastTotal) / lastTotal) * 100
      
      const total = valueKey
        ? items.reduce((s, i) => s + Number(i[valueKey] || 0), 0)
        : items.length

      return { total, growth }
    }

    const projMetrics = getMetrics(projects, 'created_at')
    const revMetrics = getMetrics(payments, 'payment_date', 'paid_amount')
    const expMetrics = getMetrics(expenses, 'expense_date', 'amount')
    const matTotal = matCosts.reduce((s, i) => s + Number(i.total_cost || 0), 0)

    const totalInvoiced = stats.totalInvoiced || 0 // Should be passed or calculated
    const totalExpenses = expMetrics.total + matTotal
    const netProfit = revMetrics.total - totalExpenses
    const pendingPayments = totalInvoiced - revMetrics.total

    return [
      {
        title: "Total Projects",
        value: projects.length,
        icon: Briefcase,
        trend: projMetrics.growth,
        subtext: "All time growth",
        colorClass: "bg-neon-blue"
      },
      {
        title: "Ongoing",
        value: projects.filter(p => p.project_status === 'ongoing').length,
        icon: Activity,
        subtext: "Actively installing",
        colorClass: "bg-neon-yellow"
      },
      {
        title: "Completed",
        value: projects.filter(p => p.project_status === 'completed').length,
        icon: CheckCircle2,
        subtext: "Successfully delivered",
        colorClass: "bg-neon-green"
      },
      {
        title: "Cancelled",
        value: projects.filter(p => p.project_status === 'cancelled').length,
        icon: XCircle,
        subtext: "Terminated projects",
        colorClass: "bg-red-500"
      },
      {
        title: "Total Revenue",
        value: `$${revMetrics.total.toLocaleString()}`,
        icon: DollarSign,
        trend: revMetrics.growth,
        subtext: "Total payments received",
        colorClass: "bg-neon-cyan"
      },
      {
        title: "Total Expenses",
        value: `$${totalExpenses.toLocaleString()}`,
        icon: TrendingDown,
        trend: expMetrics.growth,
        subtext: "Costs + Materials",
        colorClass: "bg-orange-500"
      },
      {
        title: "Net Profit",
        value: `$${netProfit.toLocaleString()}`,
        icon: Zap,
        trend: revMetrics.growth - expMetrics.growth,
        subtext: "Revenue - Total Costs",
        colorClass: "bg-neon-purple"
      },
      {
        title: "Pending Amount",
        value: `$${Math.max(0, pendingPayments).toLocaleString()}`,
        icon: Clock,
        subtext: "Invoiced but unpaid",
        colorClass: "bg-pink-500"
      }
    ]
  }, [stats, isLoading])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <KPICard key={i} isLoading />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <KPICard key={i} {...kpi} />
      ))}
    </div>
  )
}
