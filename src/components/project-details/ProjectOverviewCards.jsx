import React, { useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  TrendingDown, 
  Package, 
  Zap, 
  Percent, 
  CalendarDays,
  UserCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { clsx } from 'clsx'

const MiniCard = ({ title, value, icon: Icon, subtext, progress, colorClass, highlightValue }) => (
  <Card className="bg-glass-bg border-glass-border overflow-hidden group">
    <CardContent className="p-4 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{title}</p>
          <h3 className={clsx("text-xl font-black tracking-tight", highlightValue || "text-white")}>{value}</h3>
        </div>
        <div className={clsx("p-2 rounded-lg bg-white/5", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      
      {progress !== undefined ? (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-tighter">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-white/5" indicatorClassName={colorClass.replace('text-', 'bg-')} />
        </div>
      ) : subtext ? (
        <p className="mt-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">{subtext}</p>
      ) : null}
    </CardContent>
  </Card>
)

export default function ProjectOverviewCards({ project }) {
  const metrics = useMemo(() => {
    if (!project) return []

    // Financial calculations
    const totalInvoiced = (project.invoices || []).reduce((s, i) => s + Number(i.invoice_amount || 0), 0)
    const totalPaid = (project.payments || []).reduce((s, p) => s + Number(p.paid_amount || 0), 0)
    const pendingAmount = Math.max(0, totalInvoiced - totalPaid)
    
    const expenseTotal = (project.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
    const materialTotal = (project.materials || []).reduce((s, m) => s + Number(m.total_cost || 0), 0)
    const totalCosts = expenseTotal + materialTotal
    
    const netProfit = totalPaid - totalCosts
    const margin = totalPaid > 0 ? (netProfit / totalPaid) * 100 : 0

    // Operational metrics
    const duration = project.start_date ? differenceInDays(
      project.completion_date ? parseISO(project.completion_date) : new Date(), 
      parseISO(project.start_date)
    ) : 0
    
    const tasksDone = (project.tasks || []).filter(t => t.task_status === 'completed').length
    const totalTasks = (project.tasks || []).length
    const taskProgress = totalTasks > 0 ? (tasksDone / totalTasks) * 100 : (project.project_status === 'completed' ? 100 : 0)

    let profitColor = "text-red-400"
    if (margin > 30) profitColor = "text-neon-green"
    else if (margin > 15) profitColor = "text-neon-cyan"
    else if (margin > 0) profitColor = "text-neon-yellow"

    return [
      {
        title: "Total Invoiced",
        value: `$${totalInvoiced.toLocaleString()}`,
        icon: DollarSign,
        colorClass: "text-neon-blue",
        subtext: "Billable amounts "
      },
      {
        title: "Total Paid",
        value: `$${totalPaid.toLocaleString()}`,
        icon: CreditCard,
        colorClass: "text-neon-green",
        progress: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0
      },
      {
        title: "Pending Amount",
        value: `$${pendingAmount.toLocaleString()}`,
        icon: Clock,
        colorClass: "text-red-400",
        highlightValue: pendingAmount > 0 ? "text-red-400" : "text-gray-500"
      },
      {
        title: "Service Expenses",
        value: `$${expenseTotal.toLocaleString()}`,
        icon: TrendingDown,
        colorClass: "text-orange-400",
        subtext: "Labor, Travel, Permits"
      },
      {
        title: "Materials Cost",
        value: `$${materialTotal.toLocaleString()}`,
        icon: Package,
        colorClass: "text-neon-purple",
        subtext: "Solar components value"
      },
      {
        title: "Net Profit",
        value: `$${netProfit.toLocaleString()}`,
        icon: Zap,
        colorClass: profitColor,
        highlightValue: profitColor
      },
      {
        title: "Profit Margin",
        value: `${margin.toFixed(1)}%`,
        icon: Percent,
        colorClass: profitColor,
        subtext: margin > 30 ? "Excellent ROI" : margin > 15 ? "Healthy Margin" : margin > 0 ? "Low Margin" : "Operating at Loss"
      },
      {
        title: "Project Age",
        value: `${Math.abs(duration)} Days`,
        icon: CalendarDays,
        colorClass: "text-neon-cyan",
        subtext: project.completion_date ? "Final Duration" : "Total Time Active"
      },
      {
        title: "Lead Interest",
        value: project.leads?.status || "Converted",
        icon: UserCheck,
        colorClass: "text-neon-yellow",
        subtext: "Client satisfaction"
      },
      {
        title: "Progress",
        value: project.project_status === 'completed' ? "FINAL" : "ACTIVE",
        icon: CheckCircle,
        colorClass: "text-neon-blue",
        progress: taskProgress
      }
    ]
  }, [project])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m, i) => <MiniCard key={i} {...m} />)}
    </div>
  )
}
