import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Lightbulb,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function ProjectInsights({ project }) {
    const insights = useMemo(() => {
        if (!project) return null

        const totalInvoiced = (project.invoices || []).reduce((s, i) => s + Number(i.invoice_amount || 0), 0)
        const totalPaid = (project.payments || []).reduce((s, p) => s + Number(p.paid_amount || 0), 0)
        const expenseTotal = (project.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
        const materialTotal = (project.materials || []).reduce((s, m) => s + Number(m.total_cost || 0), 0)
        const totalCosts = expenseTotal + materialTotal
        const netProfit = totalPaid - totalCosts
        const margin = totalPaid > 0 ? (netProfit / totalPaid) * 100 : 0
        const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0

        // Calculate Score (0-100)
        let score = 50 // Base
        score += (margin > 30 ? 25 : margin > 15 ? 15 : margin > 0 ? 5 : -20)
        score += (collectionRate > 90 ? 25 : collectionRate > 50 ? 10 : -10)
        score = Math.min(100, Math.max(0, score))

        // Alerts Logic
        const alerts = []
        if (totalInvoiced > 0 && totalPaid < totalInvoiced * 0.5 && project.project_status === 'ongoing') {
            alerts.push({ type: 'danger', icon: AlertTriangle, title: "Low Cash Collection", text: "Payments collected are below 50% of total invoiced. Risk detected." })
        }
        if (materialTotal > totalInvoiced * 0.6) {
             alerts.push({ type: 'warning', icon: Info, title: "High Material Burn", text: "Material costs exceed 60% of invoice value. Review BOM." })
        }
        if (margin > 35) {
            alerts.push({ type: 'success', icon: CheckCircle, title: "Peak Efficiency", text: "Project margin is exceptional. Process should be documented." })
        }
        if (project.project_status === 'completed' && totalInvoiced > totalPaid) {
            alerts.push({ type: 'danger', icon: DollarSign, title: "Unpaid Completed Project", text: "Project is marked finished but balance is still outstanding." })
        }

        return { score, margin, netProfit, collectionRate, alerts, totalCosts }
    }, [project])

    if (!insights) return null

    const gaugeData = [
        { name: 'score', value: insights.score },
        { name: 'rest', value: 100 - insights.score }
    ]

    const GAUGE_COLORS = insights.score > 75 ? ['#10B981', '#ffffff10'] : insights.score > 40 ? ['#00F3FF', '#ffffff10'] : ['#EF4444', '#ffffff10']

    return (
        <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Score Gauge */}
                <Card className="bg-glass-bg border-glass-border overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                         <Zap className={clsx("h-5 w-5", insights.score > 75 ? "text-neon-green" : "text-neon-blue")} />
                    </div>
                    <CardHeader><CardTitle className="text-xs font-black uppercase text-gray-400">Profit Health Index</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={gaugeData} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value">
                                        {gaugeData.map((entry, index) => <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} stroke="none" />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute bottom-[20%] left-0 right-0 text-center">
                                <span className="text-5xl font-black text-white italic tracking-tighter">{insights.score}</span>
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Efficiency Points</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Diagnostics */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-white/5 border-white/5 p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Net Margin</p>
                        <h4 className={clsx("text-2xl font-black italic", insights.margin > 30 ? "text-neon-green" : "text-neon-blue")}>{insights.margin.toFixed(1)}%</h4>
                    </Card>
                    <Card className="bg-white/5 border-white/5 p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Collection</p>
                        <h4 className="text-2xl font-black italic text-white">{insights.collectionRate.toFixed(1)}%</h4>
                    </Card>
                    <Card className="bg-white/5 border-white/5 p-4 flex flex-col justify-center col-span-2">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Realized Profit</p>
                        <h4 className={clsx("text-3xl font-black italic", insights.netProfit >= 0 ? "text-neon-green" : "text-red-400")}>
                            ${insights.netProfit.toLocaleString()}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-neon-green transition-all" style={{ width: `${Math.min(100, (insights.netProfit / (insights.totalCosts || 1)) * 100)}%` }} />
                             </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* AI Smart Alerts */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-neon-yellow" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Smart Diagnostics</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.alerts.map((alert, i) => {
                        const Icon = alert.icon
                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i} 
                                className={clsx(
                                    "p-4 rounded-xl border flex gap-4 items-start",
                                    alert.type === 'danger' ? "bg-red-500/10 border-red-500/20" : 
                                    alert.type === 'warning' ? "bg-neon-yellow/10 border-neon-yellow/20" : 
                                    "bg-neon-green/10 border-neon-green/20"
                                )}
                            >
                                <div className={clsx(
                                    "p-2 rounded-lg",
                                    alert.type === 'danger' ? "text-red-500" : 
                                    alert.type === 'warning' ? "text-neon-yellow" : 
                                    "text-neon-green font-bold"
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h5 className="text-xs font-black uppercase text-white">{alert.title}</h5>
                                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{alert.text}</p>
                                </div>
                            </motion.div>
                        )
                    })}
                    {insights.alerts.length === 0 && (
                        <div className="col-span-2 p-6 rounded-xl border border-white/5 bg-white/5 flex flex-col items-center justify-center gap-2 grayscale">
                            <CheckCircle className="h-8 w-8 text-neon-green opacity-20" />
                            <p className="text-[10px] font-black uppercase text-gray-500">System Healthy - No Alerts</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
