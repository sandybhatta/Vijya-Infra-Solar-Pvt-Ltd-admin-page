import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap, 
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Download
} from 'lucide-react'
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    Tooltip 
} from 'recharts'
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export const StatCard = ({ title, value, trend, trendValue, icon: Icon, description, sparklineData, onClick }) => {
    const isPositive = trend === 'up'
    
    return (
        <Card 
            className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden bg-glass-bg border-glass-border"
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {title}
                    <TooltipProvider>
                        <UITooltip>
                            <TooltipTrigger><Info className="h-3 w-3 opacity-50" /></TooltipTrigger>
                            <TooltipContent><p>{description}</p></TooltipContent>
                        </UITooltip>
                    </TooltipProvider>
                </CardTitle>
                <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center text-xs mt-1">
                    {trendValue && (
                        <>
                            {isPositive ? (
                                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                            ) : (
                                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                            )}
                            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                                {trendValue}%
                            </span>
                            <span className="text-muted-foreground ml-1 font-light italic">vs last period</span>
                        </>
                    )}
                </div>

                {sparklineData && (
                    <div className="h-[40px] w-full mt-4 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={isPositive ? '#22c55e' : '#ef4444'} 
                                    fill={isPositive ? '#22c55e' : '#ef4444'} 
                                    fillOpacity={0.1} 
                                    strokeWidth={1.5}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export const FunnelStep = ({ label, count, percentage, conversion, color }) => (
    <div className="relative group">
        <div 
            className="h-12 flex items-center px-4 rounded-lg mb-2 border transition-all hover:scale-[1.01]"
            style={{ 
                backgroundColor: `${color}15`, 
                borderColor: `${color}30`,
                width: `${Math.max(40, percentage)}%` 
            }}
        >
            <div className="flex-1">
                <p className="text-sm font-semibold whitespace-nowrap">{label}</p>
                <p className="text-[10px] opacity-70">{count} Leads</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold">{percentage}%</p>
                {conversion && (
                    <p className="text-[10px] text-green-500 font-medium">↑ {conversion}%</p>
                )}
            </div>
        </div>
    </div>
)

export const InsightCard = ({ type, impact, title, text, action }) => {
    const isStrength = type === 'strength'
    const isWeakness = type === 'weakness'
    const isAlert = type === 'alert'

    return (
        <Card className="bg-glass-bg border-glass-border overflow-hidden">
            <div className={`h-1 w-full ${isStrength ? 'bg-green-500' : isWeakness ? 'bg-amber-500' : 'bg-red-500'}`} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant={isStrength ? 'success' : isWeakness ? 'warning' : 'destructive'} className="uppercase text-[10px]">
                        {type}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] opacity-60">Impact: {impact}</Badge>
                </div>
                <CardTitle className="text-base mt-2">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
                    "{text}"
                </p>
                {action && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Recommended Action:</p>
                        <p className="text-xs">{action}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export const SectionHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex items-center gap-3 mb-6 mt-12 pb-2 border-b border-glass-border">
        <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
    </div>
)

export const DrillDownModal = ({ isOpen, onClose, title, data, columns }) => {
    const [searchTerm, setSearchTerm] = useState('')
    
    if (!data) return null;

    const filteredData = data.filter(item => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-stone-950 border-stone-800 text-white">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="text-xl font-black">{title}</DialogTitle>
                            <p className="text-xs text-muted-foreground mt-1">Found {filteredData.length} records</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8," + 
                                columns.map(c => c.header).join(",") + "\n" +
                                filteredData.map(row => columns.map(c => row[c.key]).join(",")).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `${title.replace(/\s+/g, '_')}_Export.csv`);
                            document.body.appendChild(link);
                            link.click();
                        }}>
                            <Download className="h-3 w-3" /> Export CSV
                        </Button>
                    </div>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                            placeholder="Search in these records..." 
                            className="w-full pl-10 h-10 bg-white/5 border border-white/10 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                        <table className="w-full text-sm">
                            <thead className="bg-white/10 text-muted-foreground">
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.key} className="p-3 text-left font-medium">{col.header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                        {columns.map(col => (
                                            <td key={col.key} className="p-3">
                                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="p-10 text-center text-muted-foreground">
                                            No matching records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
