import React from 'react'
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns'

const COLORS = ['#00E5FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function EmployeeCharts({ employees = [], tasks = [] }) {
  
  // Chart 1: Tasks Completed per Day (Last 30 Days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  })

  const dailyCompletionData = last30Days.map(day => {
    const count = tasks.filter(t => 
      t.task_status === 'done' && 
      t.completed_date && 
      isSameDay(new Date(t.completed_date), day)
    ).length
    return {
      date: format(day, 'MMM dd'),
      count
    }
  })

  // Chart 2: Task Status Distribution
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.task_status] = (acc[task.task_status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value 
  }))

  // Chart 3: Salary Cost by Role
  const roleSalaries = employees.reduce((acc, emp) => {
    if (emp.is_active) {
      acc[emp.role] = (acc[emp.role] || 0) + (Number(emp.salary) || 0)
    }
    return acc
  }, {})

  const salaryData = Object.entries(roleSalaries).map(([role, amount]) => ({ 
    role, 
    amount 
  })).sort((a, b) => b.amount - a.amount)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.name.includes('Salary') ? `₹${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Completion Area Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 lg:col-span-2">
        <h3 className="text-lg font-bold text-white mb-6">Tasks Completed (30 Days)</h3>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyCompletionData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                name="Tasks Done"
                stroke="#00E5FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task Status Pie Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Status Mix</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Salary Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 lg:col-span-3">
        <h3 className="text-lg font-bold text-white mb-6">Salary Cost by Role</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="role" 
                type="category" 
                stroke="#94a3b8" 
                fontSize={12} 
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                name="Total Salary"
                fill="#8B5CF6" 
                radius={[0, 4, 4, 0]}
                barSize={32}
              >
                {salaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
