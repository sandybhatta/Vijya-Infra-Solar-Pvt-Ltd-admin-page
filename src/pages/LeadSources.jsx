import React, { useState, useMemo, useEffect } from 'react'
import {
    useGetLeadSourcesQuery,
    useGetLeadSourceStatsQuery,
    useCreateLeadSourceMutation,
    useUpdateLeadSourceMutation,
    useDeleteLeadSourceMutation,
    useLazyCheckLinkedLeadsQuery
} from '@/features/leads/leadSourcesApi'
import { useSelector } from 'react-redux'
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table'
import {
    Plus,
    Search,
    RefreshCw,
    Download,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    TrendingUp,
    TrendingDown,
    Target,
    Zap,
    AlertCircle,
    LayoutGrid,
    LayoutList,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Users,
    Activity,
    Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabaseClient'
import { SourceDetailsDrawer } from '@/components/leads/SourceDetailsDrawer'
import { saveAs } from 'file-saver'

const sourceSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name too long"),
})

function KPICard({ title, value, subtitle, icon: Icon, color, loading }) {
    return (
        <Card className="bg-glass-bg border-glass-border overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className={clsx("h-16 w-16", color)} />
            </div>
            <CardContent className="p-6 relative">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-50">{title}</p>
                <h3 className={clsx("text-2xl font-black italic tracking-tighter", color, loading && "animate-pulse")}>
                    {loading ? '---' : value}
                </h3>
                {subtitle && <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 italic">{subtitle}</p>}
            </CardContent>
        </Card>
    )
}

export default function LeadSources() {
    const { role } = useSelector(state => state.auth)
    const [viewMode, setViewMode] = useState('table') // table, grid
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([])
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingSource, setEditingSource] = useState(null)
    const [sourceToDelete, setSourceToDelete] = useState(null)
    const [linkedLeadsCount, setLinkedLeadsCount] = useState(0)
    
    // Detailed View State
    const [selectedSourceId, setSelectedSourceId] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // API
    const { data: sources, isLoading: sourcesLoading, refetch: refetchSources } = useGetLeadSourcesQuery()
    const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } = useGetLeadSourceStatsQuery()
    const [createSource, { isLoading: isCreating }] = useCreateLeadSourceMutation()
    const [updateSource, { isLoading: isUpdating }] = useUpdateLeadSourceMutation()
    const [deleteSource, { isLoading: isDeleting }] = useDeleteLeadSourceMutation()
    const [triggerCheckLeads] = useLazyCheckLinkedLeadsQuery()

    // Form
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(sourceSchema)
    })

    // Real-time Subscriptions
    useEffect(() => {
        const channel = supabase.channel('lead-sources-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_sources' }, () => {
                refetchSources()
                refetchKPIs()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                refetchSources()
                refetchKPIs()
                if (payload.eventType === 'INSERT') {
                    // Optimized: Find matching source name for toast
                    const sourceName = sources?.find(s => s.id === payload.new.source_id)?.name || 'Unknown Source'
                    toast.success(`New transmission received from ${sourceName}`, {
                        icon: '🚀',
                        style: { background: '#0c0a09', color: '#00f3ff', border: '1px solid #00f3ff' }
                    })
                }
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [refetchSources, refetchKPIs, sources])

    // Table Columns
    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent p-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Source Name <ArrowUpDown className="h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,243,255,0.5)] animate-pulse" />
                    <span className="font-bold text-white uppercase italic tracking-tight">{row.getValue('name')}</span>
                </div>
            )
        },
        {
            accessorKey: 'total_leads',
            header: 'Leads',
            cell: ({ row }) => <span className="font-mono text-gray-300">{row.getValue('total_leads')}</span>
        },
        {
            accessorKey: 'leads_this_month',
            header: 'This Month',
            cell: ({ row }) => <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{row.getValue('leads_this_month')} New</Badge>
        },
        {
            accessorKey: 'conversion_rate',
            header: 'Conv. Rate',
            cell: ({ row }) => {
                const total = row.original.total_leads
                const conv = row.original.converted_leads
                const rate = total > 0 ? ((conv / total) * 100).toFixed(1) : '0.0'
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-green-400">{rate}%</span>
                    </div>
                )
            }
        },
        {
            accessorKey: 'last_lead_date',
            header: 'Last Signal',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3 opacity-50" />
                    {row.getValue('last_lead_date') ? format(new Date(row.getValue('last_lead_date')), 'MMM dd') : 'Never'}
                </div>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                        onClick={() => { setSelectedSourceId(row.original.id); setIsDetailsOpen(true) }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-stone-900 border-stone-800 text-gray-300">
                            <DropdownMenuItem onClick={() => handleEdit(row.original)} className="gap-2"><Edit className="h-3 w-3" /> Edit Profile</DropdownMenuItem>
                            {role === 'admin' && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem onClick={() => confirmDelete(row.original)} className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-400/10"><Trash2 className="h-3 w-3" /> Decommission</DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [role, sources])

    const table = useReactTable({
        data: sources || [],
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    // Action Handlers
    const handleAdd = () => {
        setEditingSource(null)
        reset({ name: '' })
        setIsSourceModalOpen(true)
    }

    const handleEdit = (source) => {
        setEditingSource(source)
        setValue('name', source.name)
        setIsSourceModalOpen(true)
    }

    const onSubmit = async (data) => {
        try {
            if (editingSource) {
                await updateSource({ id: editingSource.id, ...data }).unwrap()
                toast.success("Source frequency updated")
            } else {
                await createSource(data).unwrap()
                toast.success("New signal source established")
            }
            setIsSourceModalOpen(false)
        } catch (error) {
            toast.error(error.message || "Failed to establish source")
        }
    }

    const confirmDelete = async (source) => {
        setSourceToDelete(source)
        const { data: count } = await triggerCheckLeads(source.id)
        setLinkedLeadsCount(count || 0)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!sourceToDelete) return
        try {
            await deleteSource(sourceToDelete.id).unwrap()
            toast.success("Source decomissioned successfully")
            setIsDeleteDialogOpen(false)
        } catch (error) {
            toast.error("Process failure")
        }
    }

    const exportCSV = () => {
        if (!sources) return
        const headers = ["Source Name", "Total Leads", "Converted", "Rejected", "Pending", "Leads This Month", "Conversion Rate %"]
        const csvData = sources.map(s => {
            const rate = s.total_leads > 0 ? ((s.converted_leads / s.total_leads) * 100).toFixed(1) : 0
            return [s.name, s.total_leads, s.converted_leads, s.rejected_leads, s.pending_leads, s.leads_this_month, rate]
        })
        
        const content = [headers, ...csvData].map(e => e.join(",")).join("\n")
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, "lead_sources_analytics.csv")
    }

    return (
        <div className="p-4 md:p-8 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                        <Zap className="h-10 w-10 text-primary shadow-[0_0_15px_rgba(0,243,255,0.4)]" />
                        Lead <span className="text-primary">Sources</span>
                    </h1>
                    <p className="text-muted-foreground text-xs mt-2 uppercase tracking-widest font-black opacity-50 italic">
                        Analyze signal efficiency and conversion protocols.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" size="sm" onClick={exportCSV} 
                        className="flex-1 md:flex-none border-primary/20 hover:bg-primary/10 text-primary text-[10px] font-black uppercase italic"
                    >
                        <Download className="h-3 w-3 mr-2" /> Export CSV
                    </Button>
                    <Button onClick={handleAdd} className="flex-1 md:flex-none bg-primary text-black hover:bg-primary/80 font-black uppercase italic tracking-widest px-8 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                        + Source Signal
                    </Button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard 
                    title="Active Sources" 
                    value={kpis?.total_sources || 0} 
                    icon={Activity} 
                    color="text-primary" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Total Transmissions" 
                    value={kpis?.total_leads || 0} 
                    icon={Users} 
                    color="text-green-500" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Top Yield" 
                    value={kpis?.best_source || '---'} 
                    subtitle="Highest Converted"
                    icon={Trophy} 
                    color="text-yellow-500" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Efficiency Leader" 
                    value={kpis?.highest_conv_rate_source || '---'} 
                    subtitle="Best % Protocol"
                    icon={Target} 
                    color="text-cyan-500" 
                    loading={kpisLoading}
                />
            </div>

            {/* Main Area */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-stone-900/50 p-3 rounded-2xl border border-white/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                        <Input 
                            value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Search Source IDs..." 
                            className="bg-transparent border-none pl-10 focus-visible:ring-0 text-white placeholder:uppercase placeholder:text-[9px] placeholder:font-black"
                        />
                    </div>
                    <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')} className="h-8 w-8"><LayoutList className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { refetchSources(); refetchKPIs(); }} className="h-8 w-8"><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Table View (Desktop) */}
                <div className={clsx("rounded-2xl border border-white/5 bg-stone-900/40 backdrop-blur-sm overflow-hidden", viewMode === 'table' ? 'block' : 'hidden md:block')}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 border-b border-white/5">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} className="p-4 text-left">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sourcesLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="p-4"><Skeleton className="h-4 w-full bg-white/5" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {table.getRowModel().rows.map((row, idx) => (
                                            <motion.tr 
                                                key={row.id} 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group hover:bg-white/5 transition-colors"
                                            >
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className="p-4">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                        <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 tracking-widest italic">
                            Protocol Stream ACTIVE | {sources?.length || 0} Sources Online
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 w-8 p-0 border-white/10"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-[10px] font-black text-white mx-2">0{table.getState().pagination.pageIndex + 1}</span>
                            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 w-8 p-0 border-white/10"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                {/* Grid/Card View (Mobile) */}
                <div className={clsx("grid gap-4", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'md:hidden')}>
                    {sourcesLoading ? (
                         Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-glass-bg border-glass-border p-5 space-y-4">
                                <div className="flex justify-between"><Skeleton className="h-6 w-24 bg-white/5" /><Skeleton className="h-5 w-16 bg-white/5" /></div>
                                <Skeleton className="h-3 w-40 bg-white/5" />
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                                    <Skeleton className="h-8 w-full bg-white/5" /><Skeleton className="h-8 w-full bg-white/5" />
                                </div>
                            </Card>
                        ))
                    ) : (
                        sources?.map((source, idx) => (
                            <motion.div 
                                key={source.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="bg-glass-bg border-glass-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer group" onClick={() => { setSelectedSourceId(source.id); setIsDetailsOpen(true) }}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{source.name}</h3>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black mt-2 italic opacity-50 tracking-widest">Signal Source Est. {format(new Date(source.created_at), 'yyyy')}</p>
                                            </div>
                                            <Badge variant="outline" className="border-primary/20 text-primary text-[10px] uppercase font-black">{source.total_leads} Signal(s)</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div className="space-y-1">
                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-50">Monthly Yield</span>
                                                <p className="text-sm font-bold text-white italic">{source.leads_this_month} New Leads</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-50">Efficiency</span>
                                                <p className="text-sm font-bold text-green-400 italic">{(source.total_leads > 0 ? (source.converted_leads/source.total_leads*100) : 0).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 flex gap-2">
                                            <Button variant="ghost" size="sm" className="flex-1 text-[9px] font-black uppercase italic tracking-widest bg-white/5" onClick={(e) => { e.stopPropagation(); handleEdit(source); }}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="flex-1 text-[9px] font-black uppercase italic tracking-widest bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black">Intelligence</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Empty State */}
                {(!sources || sources.length === 0) && !sourcesLoading && (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/2">
                        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-white uppercase italic">No Sources Online</h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto italic">Operational protocols are idle. Establish your first lead source transmission to begin data harvesting.</p>
                        <Button onClick={handleAdd} className="mt-6 bg-primary text-black">Establish Initial Signal</Button>
                    </div>
                )}
            </div>

            {/* Source Modal (Add/Edit) */}
            <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
                <DialogContent className="bg-stone-950 border-stone-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                            {editingSource ? 'Re-calibrate Source' : 'Establish Signal'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs uppercase tracking-widest font-black opacity-50">
                            Configure identity parameters for data transmission.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">Source Signature Name</Label>
                            <div className="relative">
                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input 
                                    {...register('name')} 
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary text-white italic font-bold"
                                    placeholder="e.g. NEBULA SEARCH ADS"
                                />
                            </div>
                            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-primary text-black font-black uppercase italic tracking-widest">
                                {isCreating || isUpdating ? <Loader2 className="animate-spin" /> : (editingSource ? 'EXECUTE UPDATE' : 'ESTABLISH SIGNAL')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-stone-950 border-red-500/50 text-white sm:max-w-md border-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <DialogHeader>
                        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-red-500">Decommission Protocol</DialogTitle>
                        <DialogDescription className="text-gray-300 font-bold italic leading-relaxed">
                            WARNING: Source <span className="text-white">"{sourceToDelete?.name}"</span> has <span className="text-red-400 font-black underline">{linkedLeadsCount} active lead signals</span>. 
                            Decommissioning will orphan these transmissions (setting source to NULL). 
                            <br/><br/>
                            Are you certain you wish to proceed with absolute decommissioning?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-6">
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="bg-white/5 text-white font-black uppercase text-[10px] tracking-widest">Abort</Button>
                        <Button onClick={handleDelete} disabled={isDeleting} className="bg-red-500 text-white hover:bg-red-600 font-black uppercase italic tracking-widest text-[10px]">Execute Decommissioning</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Drawer */}
            <SourceDetailsDrawer 
                sourceId={selectedSourceId}
                sourceName={sources?.find(s => s.id === selectedSourceId)?.name || ''}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    )
}

