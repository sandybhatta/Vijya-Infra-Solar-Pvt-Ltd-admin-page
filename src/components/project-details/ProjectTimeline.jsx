import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileText, 
  CreditCard, 
  Package, 
  CheckCircle2, 
  Activity, 
  TrendingDown,
  Clock,
  Briefcase
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { clsx } from 'clsx'

const EVENT_TYPES = {
  PROJECT_START: { icon: Briefcase, color: "text-neon-blue", label: "Project Initialized" },
  INVOICE: { icon: FileText, color: "text-neon-cyan", label: "Invoice Issued" },
  PAYMENT: { icon: CreditCard, color: "text-neon-green", label: "Payment Received" },
  MATERIAL: { icon: Package, color: "text-neon-purple", label: "Material Allocated" },
  TASK: { icon: CheckCircle2, color: "text-neon-blue", label: "Task Completed" },
  EXPENSE: { icon: TrendingDown, color: "text-orange-400", label: "Expense Logged" }
}

export default function ProjectTimeline({ project }) {
  const events = useMemo(() => {
    if (!project) return []

    const list = []

    // 1. Creation
    if (project.created_at) {
        list.push({
            type: 'PROJECT_START',
            date: parseISO(project.created_at),
            title: 'Project Launch',
            description: `Project "${project.project_name}" initialized for ${project.leads?.name}.`
        })
    }

    // 2. Invoices
    (project.invoices || []).forEach(inv => {
        list.push({
            type: 'INVOICE',
            date: parseISO(inv.issue_date),
            title: `Invoice ${inv.invoice_number}`,
            description: `Billed $${Number(inv.invoice_amount).toLocaleString()} to client.`
        })
    })

    // 3. Payments
    (project.payments || []).forEach(pay => {
        list.push({
            type: 'PAYMENT',
            date: parseISO(pay.payment_date),
            title: `Payment Cleared`,
            description: `Received $${Number(pay.paid_amount).toLocaleString()} via ${pay.payment_mode.replace('_', ' ')}.`
        })
    })

    // 4. Expenses
    (project.expenses || []).forEach(exp => {
        list.push({
            type: 'EXPENSE',
            date: parseISO(exp.expense_date),
            title: `${exp.category} Expense`,
            description: `$${Number(exp.amount).toLocaleString()} spent on ${exp.description || 'project needs'}.`
        })
    })

    // 5. Materials
    (project.materials || []).forEach(mat => {
        list.push({
            type: 'MATERIAL',
            date: parseISO(mat.assigned_at || project.created_at), // Assuming fallback
            title: `Logistics Deploy`,
            description: `Allocated ${mat.quantity} units of ${mat.materials?.name}.`
        })
    })

    // 6. Tasks
    (project.tasks || []).filter(t => t.task_status === 'completed').forEach(task => {
        list.push({
            type: 'TASK',
            date: task.completed_at ? parseISO(task.completed_at) : (task.scheduled_date ? parseISO(task.scheduled_date) : new Date()),
            title: `Workflow Milestone`,
            description: `Task "${task.task_name}" completed by ${task.employees?.name}.`
        })
    })

    return list.sort((a, b) => b.date - a.date)
  }, [project])

  return (
    <div className="space-y-6 mt-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="h-5 w-5 text-neon-blue" />
        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Operational Timeline</h2>
      </div>

      <div className="relative space-y-8 left-4">
        {/* Vertical Line */}
        <div className="absolute top-0 bottom-0 left-[15px] w-px bg-gradient-to-b from-neon-blue/40 via-white/5 to-transparent" />

        {events.map((event, i) => {
          const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.PROJECT_START
          const Icon = cfg.icon

          return (
            <div key={i} className="relative flex gap-6 group">
                {/* Bullet */}
                <div className={clsx(
                    "relative z-10 h-8 w-8 rounded-full border bg-black flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                    cfg.color.replace('text-', 'border-').replace('text-', 'shadow-').concat('/20')
                )}>
                    <Icon className={clsx("h-4 w-4", cfg.color)} />
                </div>

                <div className="space-y-1 pt-1 pb-4 border-b border-white/5 w-full pr-4 group-last:border-0">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{cfg.label}</span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">{format(event.date, 'dd MMM yyyy')}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{event.title}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{event.description}</p>
                </div>
            </div>
          )
        })}

        {events.length === 0 && (
          <div className="flex flex-col items-center py-12 text-gray-500 font-bold uppercase text-[10px]">
            <Clock className="h-8 w-8 mb-4 opacity-20" />
            No events logged yet
          </div>
        )}
      </div>
    </div>
  )
}
