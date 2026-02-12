import React from 'react'
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
    Zap,
    MapPin,
    DollarSign,
    Award
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
import { motion } from 'framer-motion'
import { useGetCampaignIntelligenceQuery } from '@/features/sales/marketingApi'
import { format } from 'date-fns'
import { clsx } from 'clsx'

export const CampaignDetailsDrawer = ({ campaign, isOpen, onClose }) => {
    const { data: intelligence, isLoading } = useGetCampaignIntelligenceQuery(campaign?.id, { skip: !campaign?.id })

    const COLORS = ['#00f3ff', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#6366f1']

    if (!campaign) return null

    const qualityScore = calculateQualityScore(campaign)

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl bg-stone-950/95 border-stone-800 backdrop-blur-xl p-0 overflow-y-auto">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-primary font-black uppercase text-[10px] tracking-widest animate-pulse italic">Scanning ROI Data...</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header Section */}
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Badge variant="outline" className="mb-2 border-primary/50 text-white font-black uppercase text-[9px] bg-black/40 italic">
                                        Campaign Intelligence
                                    </Badge>
                                    <SheetTitle className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                                        {campaign.name}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-3">
                                        <Badge className="bg-primary text-black font-black uppercase text-[9px] italic">{campaign.platform}</Badge>
                                        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {format(new Date(campaign.start_date), 'MMM yyyy')} - {campaign.end_date ? format(new Date(campaign.end_date), 'MMM yyyy') : 'Ongoing'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={clsx("text-xs font-black uppercase italic tracking-widest", qualityScore.color)}>
                                        Quality: {qualityScore.label}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 opacity-50">Pulse Score: {qualityScore.score}/100</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mt-8">
                                <SummaryStat label="Budget" value={`$${campaign.budget}`} icon={DollarSign} color="text-yellow-400" />
                                <SummaryStat label="Yield" value={campaign.leads_count} icon={Users} color="text-primary" />
                                <SummaryStat label="Conv. Rate" value={`${campaign.conversion_rate.toFixed(1)}%`} icon={TrendingUp} color="text-green-400" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-10 pb-20">
                            {/* ROI Breakdown */}
                            <section className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-50">Cost Per Lead (CPL)</span>
                                    <p className="text-xl font-black text-white italic">${campaign.cpl.toFixed(2)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1 text-right">
                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-50">Cost Per Acquisition (CPA)</span>
                                    <p className="text-xl font-black text-green-400 italic">${campaign.cpa.toFixed(2)}</p>
                                </div>
                            </section>

                            {/* Funnel Section */}
                            <section>
                                <SectionHeader title="Conversion Funnel" icon={Target} />
                                <div className="grid grid-cols-1 gap-2 mt-6">
                                    {intelligence?.funnel?.map((item, idx) => (
                                        <FunnelBar 
                                            key={item.status}
                                            label={item.status}
                                            count={item.count}
                                            total={campaign.leads_count}
                                            color={COLORS[idx % COLORS.length]}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Trends Chart */}
                            <section>
                                <SectionHeader title="Lead Capture Trend" subtitle="Daily Velocity (Last 30 Days)" icon={Calendar} />
                                <div className="h-[200px] w-full mt-6 bg-white/2 rounded-2xl border border-white/5 p-4 overflow-hidden">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={intelligence?.daily_trend}>
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
                            </section>

                            {/* Logic-based Insights */}
                            <section>
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden">
                                    <Zap className="h-5 w-5 text-primary mb-4" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2 italic">Marketing Strategy Insight</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed italic">
                                        {getCampaignInsight(campaign)}
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

const SummaryStat = ({ label, value, icon: Icon, color }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/40 border border-white/5 text-center">
        <Icon className={clsx("h-4 w-4 mb-2 opacity-60", color)} />
        <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground opacity-50 mb-1">{label}</span>
        <span className="text-base font-black text-white italic tracking-tighter">{value}</span>
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
        <div className="space-y-1.5 p-3 rounded-lg bg-white/2 border border-white/5 hover:bg-white/5 transition-colors group">
            <div className="flex justify-between text-[10px] items-end font-black uppercase tracking-tight italic">
                <span className="text-gray-400">{label.replace(/_/g, ' ')}</span>
                <span className="text-white">{count} <span className="text-muted-foreground/50 ml-1">({percentage.toFixed(0)}%)</span></span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
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

function calculateQualityScore(c) {
    let score = 0
    // Weightage: Conv Rate (50), CPL (25), Volume (25)
    score += Math.min(c.conversion_rate * 4, 50)
    score += Math.max(25 - (c.cpl / 10), 0)
    score += Math.min(c.leads_count, 25)
    
    score = Math.round(score)
    if (score > 80) return { label: 'ELITE', color: 'text-primary shadow-[0_0_10px_rgba(0,243,255,0.3)]', score }
    if (score > 60) return { label: 'OPTIMAL', color: 'text-green-400', score }
    if (score > 40) return { label: 'AVERAGE', color: 'text-yellow-400', score }
    return { label: 'CRITICAL', color: 'text-red-500', score }
}

function getCampaignInsight(c) {
    if (c.leads_count === 0) return "SIGNAL SILENCE: No leads detected. Check UTM configuration or platform tracking code immediately."
    
    if (c.conversion_rate > 15) {
        return "EFFICIENCY LEADER: Elite conversion profile detected. This campaign is highly calibrated. Recommendation: Increase budget by 20% to capture higher volume without performance degradation."
    }
    
    if (c.cpl > 50 && c.conversion_rate < 5) {
        return "BUDGET DEPLETION: High acquisition cost with low conversion yield. Recommend platform pivot or demographic target refinement to optimize ROI."
    }
    
    if (c.leads_count > 100 && c.status === 'Running') {
        return "STABLE FLOW: High volume production with sustainable metrics. Campaign is in 'Sweet Spot'. Maintain current allocation."
    }
    
    return "OPERATIONAL: Campaign follows baseline trajectory. Monitor for 7 days before adjusting creative bid strategies."
}
