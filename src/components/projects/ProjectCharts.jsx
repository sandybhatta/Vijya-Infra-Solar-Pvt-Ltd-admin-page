import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

const COLORS = ['#00F3FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ProjectCharts({ stats, projects = [] }) {
  const { payments = [], expenses = [], matCosts = [] } = stats || {}

  // 1. Projects Created Over Time
  const trendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    })

    return months.map(month => {
      const monthStr = format(month, 'MMM yy')
      const count = projects.filter(p => {
        const d = parseISO(p.created_at)
        return d >= startOfMonth(month) && d <= new Date(month.getFullYear(), month.getMonth() + 1, 0)
      }).length
      return { name: monthStr, count }
    })
  }, [projects])

  // 2. Revenue vs Expenses
  const financialTrendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    })

    return months.map(month => {
      const monthStr = format(month, 'MMM yy')
      const rev = payments.filter(p => isSameMonth(parseISO(p.payment_date), month)).reduce((s, i) => s + Number(i.paid_amount || 0), 0)
      const exp = expenses.filter(p => isSameMonth(parseISO(p.expense_date), month)).reduce((s, i) => s + Number(i.amount || 0), 0)
      // Material costs are hard to track by month without assigned_at, assuming they are distributed or we just show them in current
      return { name: monthStr, Revenue: rev, Expenses: exp }
    })
  }, [payments, expenses])

  function isSameMonth(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  }

  // 3. Status Distribution
  const statusData = useMemo(() => {
    const counts = projects.reduce((acc, p) => {
      acc[p.project_status] = (acc[p.project_status] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }))
  }, [projects])

  // 4. Top 10 Profitable Projects
  const profitabilityData = useMemo(() => {
    return projects
      .map(p => ({
        name: p.project_name?.substring(0, 15) || 'Unnamed',
        profit: p.net_profit || 0
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
  }, [projects])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Chart A: Projects Trends */}
      <Card className="bg-glass-bg border-glass-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-400">Projects Created</CardTitle>
          <CardDescription>New installations per month</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F3FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00F3FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                itemStyle={{ color: '#00F3FF' }}
              />
              <Area type="monotone" dataKey="count" stroke="#00F3FF" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart B: Revenue vs Expenses */}
      <Card className="bg-glass-bg border-glass-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-400">Revenue vs Expenses</CardTitle>
          <CardDescription>Monthly financial performance</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart C: Status Distribution */}
      <Card className="bg-glass-bg border-glass-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-400">Project Status</CardTitle>
          <CardDescription>Current portfolio breakdown</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
              <Legend verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart D: Top Profitability */}
      <Card className="bg-glass-bg border-glass-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-400">Top 10 Profitable Projects</CardTitle>
          <CardDescription>Projects with highest net profit</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitabilityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Bar dataKey="profit" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
