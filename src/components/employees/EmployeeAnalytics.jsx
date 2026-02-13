import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, UserX, IndianRupee, ClipboardList, CheckCircle2 } from 'lucide-react'
import { subDays, isAfter } from 'date-fns'

const KPICard = ({ title, value, icon: Icon, colorClass, prefix = "" }) => (
  <Card className="overflow-hidden border-none bg-white/5 backdrop-blur-md">
    <CardContent className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <h3 className="text-xl md:text-2xl font-black text-white">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function EmployeeAnalytics({ employees = [], tasks = [] }) {
  const activeEmployees = employees.filter(e => e.is_active)
  const inactiveEmployees = employees.filter(e => !e.is_active)
  const monthlySalary = activeEmployees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0)
  
  const pendingTasks = tasks.filter(t => t.task_status === 'pending')
  const thirtyDaysAgo = subDays(new Date(), 30)
  const completedRecentTasks = tasks.filter(t => 
    t.task_status === 'done' && 
    t.completed_date && 
    isAfter(new Date(t.completed_date), thirtyDaysAgo)
  )

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
      <KPICard 
        title="Total Staff" 
        value={employees.length} 
        icon={Users} 
        colorClass="bg-blue-500/10 text-blue-400" 
      />
      <KPICard 
        title="Active" 
        value={activeEmployees.length} 
        icon={UserCheck} 
        colorClass="bg-emerald-500/10 text-emerald-400" 
      />
      <KPICard 
        title="Inactive" 
        value={inactiveEmployees.length} 
        icon={UserX} 
        colorClass="bg-red-500/10 text-red-400" 
      />
      <KPICard 
        title="Monthly Salary" 
        value={monthlySalary} 
        prefix="₹" 
        icon={IndianRupee} 
        colorClass="bg-violet-500/10 text-violet-400" 
      />
      <KPICard 
        title="Pending Tasks" 
        value={pendingTasks.length} 
        icon={ClipboardList} 
        colorClass="bg-orange-500/10 text-orange-400" 
      />
      <KPICard 
        title="Completed (30d)" 
        value={completedRecentTasks.length} 
        icon={CheckCircle2} 
        colorClass="bg-cyan-500/10 text-cyan-400" 
      />
    </div>
  )
}
