import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
    useGetLeadsQuery, 
    useAddLeadMutation, 
    useUpdateLeadMutation, 
    useDeleteLeadMutation, 
    useBulkDeleteLeadsMutation, 
    useBulkUpdateLeadsStatusMutation,
    useGetLeadKPIsQuery,
    useGetLeadInsightsQuery
} from '@/features/leads/leadsApi'
import { 
    Users,
    Search, 
    Filter, 
    Trash2, 
    Edit, 
    CheckCircle, 
    MoreHorizontal, 
    Phone, 
    Mail, 
    MapPin, 
    Loader2, 
    X, 
    ChevronDown, 
    Globe, 
    MessageCircle, 
    Video, 
    FileText, 
    Grid, 
    LayoutList, 
    Download,
    RefreshCw,
    AlertCircle,
    UserCircle
} from 'lucide-react'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from '@/components/ui/card'
import { LeadKPIBar } from '@/components/leads/LeadKPIBar'
import { LeadFilterPanel } from '@/components/leads/LeadFilterPanel'
import { LeadInsightsPanel } from '@/components/leads/LeadInsightsPanel'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabaseClient'
import { LeadModal } from '@/pages/LeadModal'

export default function Leads() {
    const navigate = useNavigate()
    const { role } = useSelector((state) => state.auth)
    
    // --- STATE ---
    const [page, setPage] = useState(1)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'
    const [selectedIds, setSelectedIds] = useState([])
    const [isRealtime, setIsRealtime] = useState(true)
    const [filters, setFilters] = useState({
        search: '',
        status: [],
        city: 'all',
        state: 'all',
        solarType: 'all',
        datePreset: 'all',
    })
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
    const [editingLead, setEditingLead] = useState(null)

    // --- API QUERIES ---
    const { data: leadData, isLoading: leadsLoading, refetch: refetchLeads } = useGetLeadsQuery({ 
        page, 
        limit: 15,
        ...filters 
    })
    const { data: kpiStats, isLoading: statsLoading, refetch: refetchStats } = useGetLeadKPIsQuery(null, {
        pollingInterval: isRealtime ? 30000 : 0
    })
    const { data: insights, isLoading: insightsLoading } = useGetLeadInsightsQuery()

    // --- MUTATIONS ---
    const [deleteLead] = useDeleteLeadMutation()
    const [bulkDelete] = useBulkDeleteLeadsMutation()
    const [bulkUpdateStatus] = useBulkUpdateLeadsStatusMutation()

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!isRealtime) return
        const channel = supabase.channel('leads-crm')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                if (payload.eventType === 'INSERT') toast.success(`New Lead: ${payload.new.name}`, { icon: '🚀' })
                refetchLeads()
                refetchStats()
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [isRealtime])

    // --- HANDLERS ---
    const handleBulkDelete = async () => {
        if (role !== 'admin') return toast.error("Admin only operation")
        if (confirm(`Delete ${selectedIds.length} leads permanently?`)) {
            await bulkDelete(selectedIds).unwrap()
            toast.success("Bulk delete successful")
            setSelectedIds([])
        }
    }

    const handleBulkStatusUpdate = async (status) => {
        await bulkUpdateStatus({ ids: selectedIds, status }).unwrap()
        toast.success(`Updated ${selectedIds.length} leads to ${status}`)
        setSelectedIds([])
    }

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const resetFilters = () => setFilters({
        search: '', status: [], city: 'all', state: 'all', solarType: 'all', datePreset: 'all'
    })

    // --- UI ELEMENTS ---
    const StatusBadge = ({ status }) => {
        const variants = {
            new: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
            contacted: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
            site_visit_done: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
            quotation_sent: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
            negotiation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
            converted: 'bg-green-500/20 text-green-400 border-green-500/20',
            rejected: 'bg-red-500/20 text-red-400 border-red-500/20'
        }
        return (
            <Badge variant="outline" className={clsx("capitalize font-bold text-[10px] px-2 py-0", variants[status] || '')}>
                {status?.replace('_', ' ')}
            </Badge>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* 1. HEADER & ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase italic flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" /> Leads <span className="text-primary/50 text-xl font-light">CRM</span>
                    </h1>
                    <p className="text-muted-foreground text-xs mt-1">Manage and nourish your potential customer pipeline.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" size="sm" 
                        onClick={() => setIsRealtime(!isRealtime)}
                        className={clsx("gap-2 text-[10px] font-bold uppercase", isRealtime ? "text-green-500" : "text-muted-foreground")}
                    >
                        <RefreshCw className={clsx("h-3 w-3", isRealtime && "animate-spin")} />
                        {isRealtime ? 'Sync Active' : 'Sync Paused'}
                    </Button>
                    <Button onClick={() => { setEditingLead(null); setIsLeadModalOpen(true) }} className="bg-primary text-black hover:bg-primary/80 font-black uppercase italic tracking-widest px-6 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                        + Add Lead
                    </Button>
                </div>
            </div>

            {/* 2. KPI BAR */}
            <LeadKPIBar stats={kpiStats} loading={statsLoading} />

            {/* 3. MAIN CONTENT AREA (Grid with Insights) */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    {/* Controls */}
                    <div className="flex items-center justify-between bg-glass-bg border border-glass-border p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Button 
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                                size="icon" className="h-8 w-8"
                                onClick={() => setViewMode('table')}
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" className="h-8 w-8"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-6 bg-glass-border mx-2" />
                            <div className="text-xs text-muted-foreground font-medium">
                                Selected: <span className="text-primary font-bold">{selectedIds.length}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="sm" className="h-8 text-xs font-bold gap-2">
                                                Update Status <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-stone-900 border-stone-800">
                                            {['new', 'contacted', 'quotation_sent', 'converted', 'rejected'].map(s => (
                                                <DropdownMenuItem key={s} onClick={() => handleBulkStatusUpdate(s)} className="capitalize">{s.replace('_', ' ')}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {role === 'admin' && (
                                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-8 text-xs font-bold gap-2">
                                            <Trash2 className="h-3 w-3" /> Delete
                                        </Button>
                                    )}
                                </motion.div>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)} className="h-8 border-glass-border gap-2">
                                <Filter className="h-3 w-3" /> Filters
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 border-glass-border gap-2">
                                <Download className="h-3 w-3" /> Export
                            </Button>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className={clsx("bg-glass-bg border border-glass-border rounded-xl overflow-hidden", viewMode === 'table' ? 'block' : 'hidden md:block')}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-glass-border">
                                    <tr className="text-muted-foreground">
                                        <th className="p-4 text-left"><Checkbox checked={selectedIds.length === leadData?.leads?.length} onCheckedChange={() => setSelectedIds(selectedIds.length === leadData?.leads?.length ? [] : leadData?.leads?.map(l => l.id))} /></th>
                                        <th className="p-4 text-left font-black uppercase text-[10px]">Lead Information</th>
                                        <th className="p-4 text-left font-black uppercase text-[10px]">Contact Details</th>
                                        <th className="p-4 text-left font-black uppercase text-[10px]">Location & Source</th>
                                        <th className="p-4 text-left font-black uppercase text-[10px]">Status</th>
                                        <th className="p-4 text-center font-black uppercase text-[10px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leadData?.leads?.map(lead => (
                                        <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4"><Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} /></td>
                                            <td className="p-4 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                        {lead.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-primary transition-colors">{lead.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{format(new Date(lead.created_at), 'MMM dd, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <p className="flex items-center gap-2 text-xs text-gray-300"><Phone className="h-3 w-3 text-primary opacity-50" /> {lead.phone_number}</p>
                                                    <p className="flex items-center gap-2 text-xs text-gray-300"><Mail className="h-3 w-3 text-cyan-400 opacity-50" /> {lead.email}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-white italic">{lead.city}, {lead.state}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{lead.lead_sources?.name || 'Inbound'}</p>
                                                </div>
                                            </td>
                                            <td className="p-4"><StatusBadge status={lead.status} /></td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-400 hover:bg-blue-900/20" onClick={() => window.open(`tel:${lead.phone_number}`)}><Phone className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-green-400 hover:bg-green-900/20" onClick={() => window.open(`https://wa.me/${lead.phone_number}`)}><MessageCircle className="h-4 w-4" /></Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-white/10"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-stone-900 border-stone-800">
                                                            <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true) }}>Edit Lead</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-400" onClick={() => deleteLead(lead.id)}>Delete Lead</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className={clsx("grid gap-4", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'md:hidden')}>
                        {leadData?.leads?.map(lead => (
                            <Card key={lead.id} className="bg-glass-bg border-glass-border overflow-hidden group hover:border-primary/50 transition-all">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {lead.name?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white leading-none">{lead.name}</h3>
                                                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(lead.created_at), 'PPP')}</p>
                                            </div>
                                        </div>
                                        <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                                    </div>
                                    
                                    <div className="space-y-3 py-4 border-y border-white/5 mb-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground uppercase font-black text-[9px]">Location</span>
                                            <span className="text-white font-medium italic">{lead.city}, {lead.state}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground uppercase font-black text-[9px]">Solar Type</span>
                                            <Badge variant="outline" className="text-[9px] border-white/10 uppercase">{lead.solar_type || 'Unspecified'}</Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <StatusBadge status={lead.status} />
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:bg-blue-500/10" onClick={() => window.open(`tel:${lead.phone_number}`)}><Phone className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:bg-green-500/10" onClick={() => window.open(`https://wa.me/${lead.phone_number}`)}><MessageCircle className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => navigate(`/leads/${lead.id}`)}><Globe className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {leadData?.leads?.length === 0 && !leadsLoading && (
                        <div className="flex flex-col items-center justify-center py-20 bg-glass-bg border border-glass-border rounded-xl">
                            <AlertCircle className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground text-sm font-medium italic">No leads matches your current search or filters.</p>
                            <Button variant="link" onClick={resetFilters} className="text-primary mt-2">Clear All Filters</Button>
                        </div>
                    )}
                </div>

                {/* Insights Panel (Desktop Only or Side Panel) */}
                <LeadInsightsPanel insights={insights} loading={insightsLoading} />
            </div>

            {/* Filter Panel (Slide Over) */}
            <LeadFilterPanel 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)} 
                filters={filters} 
                setFilters={setFilters} 
                onReset={resetFilters}
            />

            <LeadModal 
                open={isLeadModalOpen} 
                setOpen={setIsLeadModalOpen} 
                initialData={editingLead} 
            />
        </div>
    )
}
