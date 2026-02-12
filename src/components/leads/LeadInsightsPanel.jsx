import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Target, MapPin, TrendingUp, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export const LeadInsightsPanel = ({ insights, loading }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 space-y-4"
        >
            <Card className="bg-glass-bg border-glass-border overflow-hidden">
                <CardHeader className="pb-2 border-b border-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" /> Funnel Intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    {/* Top City */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Top Performing City</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="font-bold text-white uppercase italic">{loading ? '...' : (insights?.topCity?.city || 'N/A')}</span>
                            </div>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                {loading ? '-' : (insights?.topCity?.count || 0)} Leads
                            </span>
                        </div>
                    </div>

                    {/* Source Performance */}
                    <div className="space-y-3">
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Most Successful Source</p>
                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-bold text-green-400 uppercase italic">Google Search</span>
                            </div>
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                                Highest conversion rate (12.4%) compared to offline sources.
                            </p>
                        </div>
                    </div>

                    {/* AI Suggestion */}
                    <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl relative group">
                        <Info className="h-3 w-3 absolute top-2 right-2 text-purple-400 opacity-50" />
                        <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">AI Recommendation</p>
                        <p className="text-[11px] text-gray-300">
                            Allocate 20% more budget to **Agartala** campaigns. Current demand exceeds capacity.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-glass-bg border-glass-border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase font-black">System Alert</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-bold text-red-400">5 Leads OVERDUE for follow-up</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
