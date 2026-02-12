import React, { useMemo } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    Target, 
    TrendingUp, 
    AlertCircle, 
    Users, 
    Calendar,
    ArrowUpRight,
    Loader2,
    ExternalLink,
    FileDown,
    MapPin,
    Phone,
    Zap
} from 'lucide-react'
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetLeadSourceDetailsQuery, useGetLeadSourceLeadsQuery } from '@/features/leads/leadSourcesApi'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { saveAs } from 'file-saver'

export const SourceDetailsDrawer = ({ sourceId, isOpen, onClose, sourceName }) => {
    const navigate = useNavigate()
    const { data: details, isLoading: detailsLoading } = useGetLeadSourceDetailsQuery(sourceId, { skip: !sourceId })
    const { data: latestLeads, isLoading: leadsLoading } = useGetLeadSourceLeadsQuery(sourceId, { skip: !sourceId })

    const exportSourceLeads = () => {
        if (!latestLeads) return
        const headers = ["Name", "Email", "Phone", "Status", "Created At"]
        const csvData = latestLeads.map(l => [
            l.name,
            l.email,
            l.phone_number,
            l.status,
            format(new Date(l.created_at), 'yyyy-MM-dd HH:mm')
        ])
        
        const content = [headers, ...csvData].map(e => e.join(",")).join("\n")
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, `leads_${sourceName.toLowerCase().replace(' ', '_')}.csv`)
    }

    const COLORS = ['#00f3ff', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#6366f1']

    if (!sourceId) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl bg-stone-950/95 border-stone-800 backdrop-blur-xl p-0 overflow-y-auto">
                {detailsLoading ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-primary font-black uppercase text-[10px] tracking-widest animate-pulse italic">Scanning Intelligence Data...</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header Section */}
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Badge variant="outline" className="mb-2 border-primary/50 text-primary font-black uppercase text-[9px]">Source Intelligence</Badge>
                                    <SheetTitle className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                                        {sourceName}
                                    </SheetTitle>
                                    <p className="text-muted-foreground text-xs mt-2 italic flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> Data aggregated since {details?.summary?.first_lead ? format(new Date(details.summary.first_lead), 'PPP') : 'N/A'}
                                    </p>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full border border-white/10" onClick={onClose}>
                                    <Zap className="h-4 w-4 text-primary" />
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <SummaryBadge 
                                    label="Total Leads" 
                                    value={details?.summary?.total_leads || 0} 
                                    icon={Users}
                                    color="border-blue-500/20 text-blue-400"
                                />
                                <SummaryBadge 
                                    label="Conv. Rate" 
                                    value={`${(details?.summary?.conversion_rate || 0).toFixed(1)}%`} 
                                    icon={TrendingUp}
                                    color="border-green-500/20 text-green-400"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-10 pb-20">
                            {/* Funnel Section */}
                            <section>
                                <SectionHeader title="Conversion Funnel" icon={Target} />
                                <div className="grid grid-cols-1 gap-2 mt-4">
                                    {details?.funnel?.map((item, idx) => (
                                        <FunnelBar 
                                            key={item.status}
                                            label={item.status}
                                            count={item.count}
                                            total={details.summary.total_leads}
                                            color={COLORS[idx % COLORS.length]}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Charts Section */}
                            <section className="space-y-8">
                                <div>
                                    <SectionHeader title="Lead Volume Trend" subtitle="Last 30 Days Activity" icon={Calendar} />
                                    <div className="h-[180px] w-full mt-6 bg-white/2 rounded-xl border border-white/5 p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={details?.daily_trend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="date" hide />
                                                <YAxis hide />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', fontSize: '10px' }}
                                                    itemStyle={{ color: '#00f3ff' }}
                                                />
                                                <Line type="monotone" dataKey="count" stroke="#00f3ff" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div>
                                    <SectionHeader title="Monthly Conversion" subtitle="Performance Stability (6 Months)" icon={TrendingUp} />
                                    <div className="h-[180px] w-full mt-6 bg-white/2 rounded-xl border border-white/5 p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={details?.monthly_conv}>
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                                                <YAxis hide />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', fontSize: '10px' }}
                                                />
                                                <Bar dataKey="conv_rate" radius={[4, 4, 0, 0]}>
                                                    {details?.monthly_conv?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === details.monthly_conv.length - 1 ? '#00f3ff' : 'rgba(0, 243, 255, 0.2)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>

                            {/* AI Insights */}
                            <section>
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/10 blur-3xl rounded-full" />
                                    <Zap className="h-5 w-5 text-primary mb-4" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2 italic">Performance Insight</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed italic">
                                        {getSourceInsight(details?.summary)}
                                    </p>
                                </div>
                            </section>

                            {/* Latest Leads */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader title="Recent Transmissions" icon={Users} />
                                    <Button variant="ghost" size="sm" className="hidden sm:flex h-7 text-[9px] uppercase font-bold gap-2 text-muted-foreground" onClick={exportSourceLeads}>
                                        <FileDown className="h-3 w-3" /> Export Leads
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {latestLeads?.map(lead => (
                                        <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                    {lead.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white leading-none">{lead.name}</p>
                                                    <p className="text-[9px] text-muted-foreground mt-1 capitalize">{lead.status.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => navigate(`/leads/${lead.id}`)}
                                            >
                                                <ArrowUpRight className="h-4 w-4 text-primary" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!latestLeads || latestLeads.length === 0) && (
                                        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                                            <p className="text-[10px] text-muted-foreground uppercase italic font-bold">No active lead signals found</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

const SummaryBadge = ({ label, value, icon: Icon, color }) => (
    <div className={clsx("p-4 rounded-2xl border bg-stone-900/50 flex flex-col gap-1", color)}>
        <Icon className="h-4 w-4 opacity-50 mb-1" />
        <span className="text-[9px] uppercase font-black tracking-widest opacity-60 leading-none">{label}</span>
        <span className="text-xl font-black italic tracking-tighter">{value}</span>
    </div>
)

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
    <div>
        <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">{title}</h3>
        </div>
        {subtitle && <p className="text-[10px] text-muted-foreground uppercase font-medium">{subtitle}</p>}
    </div>
)

const FunnelBar = ({ label, count, total, color }) => {
    const percentage = total > 0 ? (count / total * 100) : 0
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] items-end font-bold uppercase tracking-tight">
                <span className="text-gray-400 italic">{label.replace('_', ' ')}</span>
                <span className="text-white">{count} <span className="text-muted-foreground/50 ml-1">({percentage.toFixed(0)}%)</span></span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                />
            </div>
        </div>
    )
}

function getSourceInsight(summary) {
    if (!summary) return "Processing source signal..."
    
    if (summary.conversion_rate > 15) {
        return "CRITICAL ADVANTAGE: This source displays an elite conversion profile. Recommendation: Scale budget allocation to maximize high-quality yield immediately."
    }
    if (summary.total_leads > 50 && summary.conversion_rate < 5) {
        return "EFFICIENCY WARNING: High signal volume detected but conversion protocols are failing. Audit your sales follow-up script or secondary qualification filters."
    }
    if (summary.rejection_rate > 40) {
        return "SIGNAL NOISE DETECTED: High rejection rate suggests targeting misalignment. Re-evaluate the source demographic parameters to reduce wasted resources."
    }
    if (summary.avg_per_month < 2 && summary.total_leads > 0) {
        return "DORMANT SIGNAL: Slow data frequency. This source might be seasonal or require a refreshed creative strategy to regain momentum."
    }
    
    return "STABLE PROTOCOL: Signal quality and conversion rate are within optimal operational parameters. Maintain current strategy and monitor for drift."
}
