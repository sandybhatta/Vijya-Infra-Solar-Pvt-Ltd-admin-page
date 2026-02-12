import React from 'react'
import { StatsCard } from '@/components/layout/StatsCard'
import { Users, DollarSign, Activity, TrendingUp, Package, AlertTriangle, Zap, CheckCircle, Clock } from 'lucide-react'
import { useGetDashboardStatsQuery, useGetRevenueTrendQuery, useGetLeadSourcesQuery } from '@/features/dashboard/dashboardApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { ScrollArea } from "@/components/ui/scroll-area"
import LatestEnquiries from '@/components/dashboard/LatestEnquiries'

const COLORS = ['#00f3ff', '#bc13fe', '#0aff0a', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStatsQuery(undefined, { pollingInterval: 60000 })
  const { data: revenueData } = useGetRevenueTrendQuery()
  const { data: leadSourceData } = useGetLeadSourcesQuery()
  
  const [realtimeLeads, setRealtimeLeads] = React.useState([])

  React.useEffect(() => {
    // Initial fetch of recent leads
    const fetchRecent = async () => {
        const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5)
        if (data) setRealtimeLeads(data)
    }
    fetchRecent()

    // Realtime subscription
    const subscription = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
        setRealtimeLeads(prev => [payload.new, ...prev].slice(0, 5))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (isLoading) return <div className="p-8 text-neon-blue animate-pulse">Loading Mission Control...</div>

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex-1 space-y-6 p-4 md:p-8 pt-6"
    >
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Mission Control</h2>
        <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground animate-pulse">● System Online</span>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
            <StatsCard title="Total Revenue" value={`$${stats?.totalRevenue?.toLocaleString()}`} icon={DollarSign} description="lifetime earnings" className="border-neon-blue/20 shadow-[0_0_15px_rgba(0,243,255,0.1)]" textClassName="text-neon-blue" />
        </motion.div>
        <motion.div variants={item}>
            <StatsCard title="Net Profit" value={`$${stats?.netProfit?.toLocaleString()}`} icon={TrendingUp} description="after expenses" className="border-neon-green/20 shadow-[0_0_15px_rgba(10,255,10,0.1)]" textClassName="text-neon-green" />
        </motion.div>
        <motion.div variants={item}>
            <StatsCard title="Total Leads" value={stats?.totalLeads} icon={Users} description={`+${stats?.leadsToday} today`} className="border-neon-purple/20 shadow-[0_0_15px_rgba(188,19,254,0.1)]" textClassName="text-neon-purple" />
        </motion.div>
        <motion.div variants={item}>
            <StatsCard title="Conversion Rate" value={`${stats?.conversionRate}%`} icon={Activity} description="lead to project" />
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <motion.div variants={item}><StatsCard title="Ongoing Projects" value={stats?.ongoingProjects} icon={Zap} description="active installations" /></motion.div>
           <motion.div variants={item}><StatsCard title="Pending Invoices" value={`$${stats?.outstandingInvoiceAmount?.toLocaleString()}`} icon={AlertTriangle} description={`${stats?.overdueInvoiceCount} overdue`} textClassName="text-red-400" /></motion.div>
           <motion.div variants={item}><StatsCard title="Low Stock Alerts" value={stats?.lowStockCount} icon={Package} description="items below threshold" textClassName={stats?.lowStockCount > 0 ? "text-red-400" : "text-green-400"} /></motion.div>
           <motion.div variants={item}><StatsCard title="Completed Projects" value={stats?.completedProjects} icon={CheckCircle} description="lifetime completions" /></motion.div>
      </div>
      
      {/* Latest Enquiries Section */}
      <motion.div variants={item}>
        <LatestEnquiries />
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
            <Card className="bg-glass-bg border-glass-border">
            <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Monthly revenue vs profit</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData || []}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <Area type="monotone" dataKey="revenue" stroke="#00f3ff" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" stroke="#bc13fe" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={item} className="col-span-3">
            <Card className="h-full bg-glass-bg border-glass-border">
            <CardHeader>
                <CardTitle>Live Lead Feed</CardTitle>
                <CardDescription>Realtime incoming leads</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px]">
                    <div className="space-y-6">
                        {realtimeLeads.map((lead, i) => (
                            <motion.div 
                                key={lead.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <div className="h-9 w-9 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none text-white">{lead.name}</p>
                                    <p className="text-xs text-muted-foreground">{lead.city || 'Unknown Location'}</p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-neon-blue capitalize bg-neon-blue/10 px-2 py-1 rounded-full border border-neon-blue/20">
                                    {lead.status}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            </Card>
        </motion.div>
      </div>

      {/* Secondary Charts */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <motion.div variants={item} className="col-span-1">
              <Card className="bg-glass-bg border-glass-border">
                  <CardHeader><CardTitle>Lead Sources</CardTitle></CardHeader>
                  <CardContent className="flex justify-center">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie 
                            data={leadSourceData || []} 
                            cx="50%" cy="50%" 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value"
                          >
                            {(leadSourceData || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
          </motion.div>
           <motion.div variants={item} className="col-span-2">
              <Card className="bg-glass-bg border-glass-border">
                  <CardHeader><CardTitle>Funnel Velocity</CardTitle></CardHeader>
                  <CardContent>
                      <div className="h-[250px] w-full flex items-end justify-around space-x-2 relative px-4">
                          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gray-700" />
                          <div className="w-1/5 bg-gradient-to-t from-neon-blue/50 to-neon-blue/10 h-[100%] rounded-t-lg flex flex-col items-center justify-end pb-2 border-t border-x border-neon-blue/30 backdrop-blur-sm transition-all hover:h-[102%]">
                              <span className="text-xs text-neon-blue mb-1">New</span>
                              <span className="font-bold text-white">100%</span>
                          </div>
                          <div className="w-1/5 bg-gradient-to-t from-neon-purple/50 to-neon-purple/10 h-[65%] rounded-t-lg flex flex-col items-center justify-end pb-2 border-t border-x border-neon-purple/30 backdrop-blur-sm transition-all hover:h-[67%]">
                              <span className="text-xs text-neon-purple mb-1">Contacted</span>
                              <span className="font-bold text-white">65%</span>
                          </div>
                          <div className="w-1/5 bg-gradient-to-t from-pink-500/50 to-pink-500/10 h-[45%] rounded-t-lg flex flex-col items-center justify-end pb-2 border-t border-x border-pink-500/30 backdrop-blur-sm transition-all hover:h-[47%]">
                              <span className="text-xs text-pink-400 mb-1">Quoted</span>
                              <span className="font-bold text-white">45%</span>
                          </div>
                          <div className="w-1/5 bg-gradient-to-t from-neon-green/50 to-neon-green/10 h-[25%] rounded-t-lg flex flex-col items-center justify-end pb-2 border-t border-x border-neon-green/30 backdrop-blur-sm transition-all hover:h-[27%]">
                              <span className="text-xs text-neon-green mb-1">Won</span>
                              <span className="font-bold text-white">25%</span>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </motion.div>
      </div>
    </motion.div>
  )
}
