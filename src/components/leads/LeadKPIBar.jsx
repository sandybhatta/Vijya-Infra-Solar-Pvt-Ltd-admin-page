import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, UserPlus, Calendar, CheckCircle2, TrendingUp, XCircle, FileText, IndianRupee } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

const KPICard = ({ title, value, icon: Icon, color, loading }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-w-[150px]"
    >
        <Card className="bg-glass-bg border-glass-border overflow-hidden group hover:border-primary/50 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mb-1">{title}</p>
                    <h3 className={clsx("text-xl font-bold", loading ? "animate-pulse" : "text-white")}>
                        {loading ? '---' : value}
                    </h3>
                </div>
                <div className={clsx("p-2 rounded-lg", color)}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
            <div className={clsx("h-1 w-full bg-muted", color.replace('bg-', 'bg-').replace('/10', ''))} />
        </Card>
    </motion.div>
)

export const LeadKPIBar = ({ stats, loading }) => {
    return (
        <div className="flex flex-wrap gap-4 mt-6">
            <KPICard 
                title="Total Leads" 
                value={stats?.total || 0} 
                icon={Users} 
                color="bg-blue-500/10 text-blue-500" 
                loading={loading}
            />
            <KPICard 
                title="New Today" 
                value={stats?.today || 0} 
                icon={UserPlus} 
                color="bg-purple-500/10 text-purple-500" 
                loading={loading}
            />
            <KPICard 
                title="Contacted" 
                value={stats?.contacted || 0} 
                icon={Calendar} 
                color="bg-yellow-500/10 text-yellow-500" 
                loading={loading}
            />
            <KPICard 
                title="Converted" 
                value={stats?.converted || 0} 
                icon={CheckCircle2} 
                color="bg-green-500/10 text-green-500" 
                loading={loading}
            />
            <KPICard 
                title="Conv. Rate" 
                value={`${stats?.conversionRate || 0}%`} 
                icon={TrendingUp} 
                color="bg-cyan-500/10 text-cyan-500" 
                loading={loading}
            />
            <KPICard 
                title="Pipeline Value" 
                value={`₹${(stats?.pipelineValue || 0).toLocaleString()}`} 
                icon={IndianRupee} 
                color="bg-amber-500/10 text-amber-500" 
                loading={loading}
            />
        </div>
    )
}
