import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Filter, X, Search, Calendar as CalendarIcon, MapPin, Zap, Globe, SlidersHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'

export const LeadFilterPanel = ({ filters, setFilters, onReset, isOpen, onClose }) => {
    const STATUS_OPTIONS = [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Site Visit', value: 'site_visit_done' },
        { label: 'Quotation Sent', value: 'quotation_sent' },
        { label: 'Negotiation', value: 'negotiation' },
        { label: 'Converted', value: 'converted' },
        { label: 'Rejected', value: 'rejected' },
    ]

    return (
        <div className={clsx(
            "fixed inset-y-0 right-0 w-80 bg-stone-950 border-l border-stone-800 p-6 z-50 transition-transform duration-300 transform shadow-2xl overflow-y-auto",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight text-white uppercase italic">Advanced Filters</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-stone-400 hover:text-white">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black">Search Leads</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Name, email, phone..." 
                            className="pl-9 bg-white/5 border-white/10"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black">Multi-Status Filter</Label>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(opt => (
                            <Badge 
                                key={opt.value}
                                variant={filters.status.includes(opt.value) ? "default" : "outline"}
                                className={clsx(
                                    "cursor-pointer hover:bg-primary transition-colors",
                                    !filters.status.includes(opt.value) && "opacity-60 grayscale"
                                )}
                                onClick={() => {
                                    const newStatus = filters.status.includes(opt.value) 
                                        ? filters.status.filter(s => s !== opt.value)
                                        : [...filters.status, opt.value]
                                    setFilters({ ...filters, status: newStatus })
                                }}
                            >
                                {opt.label}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* City/State */}
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black">Location</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input 
                            placeholder="City" 
                            value={filters.city} 
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            className="bg-white/5 border-white/10"
                        />
                        <Input 
                            placeholder="State" 
                            value={filters.state} 
                            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                            className="bg-white/5 border-white/10"
                        />
                    </div>
                </div>

                {/* Solar Type */}
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black">Solar Type</Label>
                    <Select value={filters.solarType} onValueChange={(v) => setFilters({...filters, solarType: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-900 border-stone-800">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="On-Grid">On-Grid</SelectItem>
                            <SelectItem value="Off-Grid">Off-Grid</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Ranges */}
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black">Created Date</Label>
                    <Select value={filters.datePreset} onValueChange={(v) => setFilters({...filters, datePreset: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-900 border-stone-800">
                            <SelectItem value="all">Any time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-8 space-y-2">
                    <Button className="w-full bg-primary text-black font-bold uppercase italic tracking-widest" onClick={onClose}>
                        APPLY FILTERS
                    </Button>
                    <Button variant="ghost" className="w-full text-stone-400 hover:text-white" onClick={onReset}>
                        RESET ALL
                    </Button>
                </div>
            </div>
        </div>
    )
}
