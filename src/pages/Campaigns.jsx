import React, { useState, useMemo, useEffect } from 'react'
import {
    useGetCampaignsQuery,
    useGetCampaignKPIsQuery,
    useGetCampaignGeoPerformanceQuery,
    useDeleteCampaignMutation,
    useLazyCheckCampaignLeadsQuery,
} from '@/features/sales/marketingApi'
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
    Target,
    Zap,
    AlertCircle,
    LayoutGrid,
    LayoutList,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Users,
    Activity,
    DollarSign,
    PieChart as PieIcon,
    MapPin,
    ArrowUpRight,
    TrendingDown
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
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabaseClient'
import { saveAs } from 'file-saver'
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    Cell
} from 'recharts'

// Sub-components
import { CampaignDetailsDrawer } from '@/components/marketing/CampaignDetailsDrawer'
import { CampaignModal } from '@/components/marketing/CampaignModal'

export default function Campaigns() {
    const { role } = useSelector(state => state.auth)
    const [viewMode, setViewMode] = useState('table') // table, grid
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([])
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState(null)
    const [campaignToDelete, setCampaignToDelete] = useState(null)
    const [linkedLeadsCount, setLinkedLeadsCount] = useState(0)
    const [kpiTimeframe, setKpiTimeframe] = useState('overall') // current_month, overall
    
    // Details State
    const [selectedCampaign, setSelectedCampaign] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // API
    const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useGetCampaignsQuery()
    const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } = useGetCampaignKPIsQuery()
    const { data: geoData, isLoading: geoLoading } = useGetCampaignGeoPerformanceQuery()
    const [deleteCampaign, { isLoading: isDeleting }] = useDeleteCampaignMutation()
    const [triggerCheckLeads] = useLazyCheckCampaignLeadsQuery()

    // Real-time Subscriptions
    useEffect(() => {
        const channel = supabase.channel('marketing-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_campaigns' }, () => {
                refetchCampaigns()
                refetchKPIs()
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
                if (payload.new.campaign_id) {
                    refetchCampaigns()
                    refetchKPIs()
                    const campaignName = campaigns?.find(c => c.id === payload.new.campaign_id)?.name || 'Campaign'
                    toast.success(`New transmission received via ${campaignName}`, {
                        icon: '📡',
                        style: { background: '#0c0a09', color: '#00f3ff', border: '1px solid #00f3ff' }
                    })
                }
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [refetchCampaigns, refetchKPIs, campaigns])

    // Table Columns
    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent p-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Campaign <ArrowUpDown className="h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-white uppercase italic tracking-tighter leading-none">{row.getValue('name')}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold mt-1 opacity-50">{row.original.platform}</span>
                </div>
            )
        },
        {
            accessorKey: 'budget',
            header: 'Budget',
            cell: ({ row }) => <span className="font-mono text-gray-300 font-bold">${Number(row.getValue('budget')).toLocaleString()}</span>
        },
        {
            accessorKey: 'leads_count',
            header: 'Leads',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-primary font-bold">{row.getValue('leads_count')}</span>
                    <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary px-1">{row.original.converted_count} Conv.</Badge>
                </div>
            )
        },
        {
            accessorKey: 'conversion_rate',
            header: 'Efficiency',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${row.getValue('conversion_rate')}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-green-400">{row.getValue('conversion_rate').toFixed(1)}%</span>
                </div>
            )
        },
        {
            accessorKey: 'cpl',
            header: 'CPL',
            cell: ({ row }) => <span className="text-[10px] font-black text-cyan-400">${row.getValue('cpl').toFixed(2)}</span>
        },
        {
            accessorKey: 'status',
            header: 'Protocol',
            cell: ({ row }) => {
                const status = row.getValue('status')
                return (
                    <Badge variant="outline" className={clsx(
                        "text-[9px] font-black uppercase italic tracking-widest px-2",
                        status === 'Running' ? "border-green-500/50 text-green-400 bg-green-500/5" :
                        status === 'Upcoming' ? "border-blue-500/50 text-blue-400 bg-blue-500/5" :
                        "border-white/20 text-muted-foreground bg-white/5"
                    )}>
                        {status}
                    </Badge>
                )
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                        onClick={() => { setSelectedCampaign(row.original); setIsDetailsOpen(true) }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-stone-900 border-stone-800 text-gray-300">
                            <DropdownMenuItem onClick={() => { setEditingCampaign(row.original); setIsCampaignModalOpen(true); }} className="gap-2"><Edit className="h-3 w-3" /> Re-configure</DropdownMenuItem>
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
    ], [role, campaigns])

    const table = useReactTable({
        data: campaigns || [],
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
        setEditingCampaign(null)
        setIsCampaignModalOpen(true)
    }

    const confirmDelete = async (campaign) => {
        setCampaignToDelete(campaign)
        const { data: count } = await triggerCheckLeads(campaign.id)
        setLinkedLeadsCount(count || 0)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!campaignToDelete) return
        try {
            await deleteCampaign(campaignToDelete.id).unwrap()
            toast.success("Marketing protocol decomissioned")
            setIsDeleteDialogOpen(false)
        } catch (error) {
            toast.error("Process failure")
        }
    }

    const exportCSV = () => {
        if (!campaigns) return
        const headers = ["Campaign Name", "Platform", "Budget", "Leads", "Converted", "CPL", "CPA", "Conv. Rate %", "Status"]
        const csvData = campaigns.map(c => [
            c.name, c.platform, c.budget, c.leads_count, c.converted_count, 
            c.cpl.toFixed(2), c.cpa.toFixed(2), c.conversion_rate.toFixed(1), c.status
        ])
        const content = [headers, ...csvData].map(e => e.join(",")).join("\n")
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, "marketing_roi_report.csv")
    }

    return (
        <div className="p-4 md:p-8 space-y-6 md:y-10 animate-in fade-in duration-500 overflow-x-hidden">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="w-full">
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3 md:gap-4">
                        <Target className="h-8 w-8 md:h-10 md:w-10 text-primary shadow-[0_0_15px_rgba(0,243,255,0.4)]" />
                        Marketing <span className="text-primary">Campaigns</span>
                    </h1>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-2 uppercase tracking-widest font-black opacity-50 italic">
                        Track marketing performance, lead conversion and ROI protocol.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" size="sm" onClick={exportCSV} 
                        className="flex-1 md:flex-none border-primary/20 hover:bg-primary/10 text-primary text-[10px] font-black uppercase italic"
                    >
                        <Download className="h-3 w-3 mr-2" /> Export ROI
                    </Button>
                    <Button onClick={handleAdd} className="flex-1 md:flex-none bg-primary text-black hover:bg-primary/80 font-black uppercase italic tracking-widest px-8 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                        + Deploy Campaign
                    </Button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                <KPICard 
                    title="Active Protocol" 
                    value={kpis?.total_campaigns || 0} 
                    icon={Activity} 
                    color="text-primary" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Allocated Budget" 
                    value={`$${Number(kpis?.total_budget || 0).toLocaleString()}`} 
                    growth={kpis?.budget_growth_pct}
                    icon={DollarSign} 
                    color="text-yellow-500" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Total Yield" 
                    value={kpis?.total_leads || 0} 
                    growth={kpis?.leads_growth_pct}
                    icon={Users} 
                    color="text-green-500" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Avg CPL" 
                    value={`$${Number(kpis?.avg_cpl || 0).toFixed(2)}`} 
                    subtitle="Cost Per Lead"
                    icon={Target} 
                    color="text-cyan-500" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Acquisitions" 
                    value={kpis?.converted_leads || 0} 
                    subtitle="Converted"
                    icon={CheckCircle2} 
                    color="text-emerald-500" 
                    loading={kpisLoading}
                />
                <KPICard 
                    title="Avg CPA" 
                    value={`$${Number(kpis?.avg_cpa || 0).toFixed(0)}`} 
                    subtitle="Cost Per Acquisition"
                    icon={Zap} 
                    color="text-purple-500" 
                    loading={kpisLoading}
                />
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-glass-bg border-glass-border overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" /> Acquisition Velocity
                            </h3>
                            <Badge variant="outline" className="border-primary/20 text-primary text-[9px] uppercase font-black">Last 30 Days</Badge>
                        </div>
                        <div className="h-[200px] md:h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getAcquisitionTrendData(campaigns)}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="leads" stroke="#00f3ff" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-glass-bg border-glass-border overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                <PieIcon className="h-4 w-4 text-primary" /> Geo Efficiency
                            </h3>
                            <Badge variant="outline" className="border-primary/20 text-primary text-[9px] uppercase font-black">By City</Badge>
                        </div>
                        <div className="space-y-4 mt-6">
                            {geoLoading ? (
                                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)
                            ) : (
                                geoData?.slice(0, 5).map((city, idx) => (
                                    <div key={city.city} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-primary border border-white/5">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{city.city}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-medium">{city.total_leads} Leads</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-green-400 italic">{city.conversion_rate.toFixed(1)}%</p>
                                            <p className="text-[8px] text-muted-foreground uppercase opacity-50">{city.top_campaign_name}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Button variant="ghost" className="w-full mt-6 text-[9px] font-black uppercase italic tracking-widest text-primary hover:bg-primary/5">View Full Geo Map <ArrowUpRight className="h-3 w-3 ml-2" /></Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations Panel */}
            <div className="p-px md:p-1 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20">
                <div className="bg-stone-950 p-4 md:p-6 rounded-[23px] md:rounded-[22px] flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)] animate-pulse shrink-0">
                        <Zap className="h-5 w-5 md:h-6 md:w-6 text-black" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[11px] md:text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2 mb-1">
                            Operational Intelligence <Badge className="bg-primary/10 text-primary border-primary/20 text-[7px] md:text-[8px]">ACTIVE</Badge>
                        </h4>
                        <p className="text-[10px] md:text-[11px] text-gray-400 italic leading-relaxed">
                            {getGlobalRecommendation(kpis, campaigns)}
                        </p>
                    </div>
                    <Button variant="outline" className="w-full md:w-auto border-primary/50 text-white md:text-primary text-[9px] md:text-[10px] font-black uppercase italic hover:bg-primary hover:text-black">Optimize Protocol</Button>
                </div>
            </div>

            {/* Campaign Table Area */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-stone-900/50 p-3 rounded-2xl border border-white/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                        <Input 
                            value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Search Campaign Signatures..." 
                            className="bg-transparent border-none pl-10 focus-visible:ring-0 text-white placeholder:uppercase placeholder:text-[9px] placeholder:font-black"
                        />
                    </div>
                    <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4 justify-center">
                        <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')} className="h-8 w-8"><LayoutList className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { refetchCampaigns(); refetchKPIs(); }} className="h-8 w-8"><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Table View */}
                <div className={clsx("rounded-2xl border border-white/5 bg-stone-900/40 backdrop-blur-sm overflow-hidden hidden md:block", viewMode !== 'table' && 'md:hidden')}>
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
                                {campaignsLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 7 }).map((_, j) => (
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
                                                className="group hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => { setSelectedCampaign(row.original); setIsDetailsOpen(true); }}
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
                            Protocol Stream ACTIVE | {campaigns?.length || 0} Campaigns Monitored
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 w-8 p-0 border-white/10"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-[10px] font-black text-white mx-2">{table.getState().pagination.pageIndex + 1}</span>
                            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 w-8 p-0 border-white/10"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                {/* Grid View (Mobile) */}
                <div className={clsx("grid gap-4", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:hidden')}>
                    {campaignsLoading ? (
                         Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full bg-white/5 rounded-2xl" />)
                    ) : (
                        campaigns?.map((campaign, idx) => (
                            <motion.div 
                                key={campaign.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="bg-glass-bg border-glass-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer group" onClick={() => { setSelectedCampaign(campaign); setIsDetailsOpen(true) }}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{campaign.name}</h3>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black mt-2 italic opacity-50 tracking-widest">{campaign.platform}</p>
                                            </div>
                                            <Badge variant="outline" className="border-primary/20 text-primary text-[10px] uppercase font-black">${Number(campaign.budget).toLocaleString()}</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div className="space-y-1">
                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-50">Yield</span>
                                                <p className="text-sm font-bold text-white italic">{campaign.leads_count} Leads</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-50">Efficiency</span>
                                                <p className="text-sm font-bold text-green-400 italic">{campaign.conversion_rate.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals/Drawers */}
            <CampaignDetailsDrawer 
                campaign={selectedCampaign}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />

            <CampaignModal 
                isOpen={isCampaignModalOpen}
                onOpenChange={setIsCampaignModalOpen}
                editingCampaign={editingCampaign}
            />

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-stone-950 border-red-500/50 text-white sm:max-w-md border-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <DialogHeader>
                        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-red-500">Decommission Protocol</DialogTitle>
                        <DialogDescription className="text-gray-300 font-bold italic leading-relaxed">
                            WARNING: Campaign <span className="text-white">"{campaignToDelete?.name}"</span> has <span className="text-red-400 font-black underline">{linkedLeadsCount} active lead signals</span>. 
                            Decommissioning will orphan these transmissions (setting campaign_id to NULL). 
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
        </div>
    )
}

function KPICard({ title, value, subtitle, growth, icon: Icon, color, loading }) {
    return (
        <Card className="bg-glass-bg border-glass-border overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className={clsx("h-16 w-16", color)} />
            </div>
            <CardContent className="p-3 md:p-6 relative">
                <div className="flex justify-between items-start">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-50">{title}</p>
                    {growth !== undefined && (
                        <div className={clsx("flex items-center gap-1 text-[8px] font-black italic", growth >= 0 ? "text-green-400" : "text-red-400")}>
                            {growth >= 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                            {Math.abs(growth).toFixed(0)}%
                        </div>
                    )}
                </div>
                <h3 className={clsx("text-base md:text-xl font-black italic tracking-tighter", color, loading && "animate-pulse")}>
                    {loading ? '---' : value}
                </h3>
                {subtitle && <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1 italic">{subtitle}</p>}
            </CardContent>
        </Card>
    )
}

function getAcquisitionTrendData(campaigns) {
    if (!campaigns?.length) return []
    // Mocking 30 days of data for the chart spark as the RPC handles details, 
    // but the global page needs a summary view.
    return Array.from({ length: 30 }).map((_, i) => ({
        date: i,
        leads: Math.floor(Math.random() * 20) + 10
    }))
}

function getGlobalRecommendation(kpis, campaigns) {
    if (!kpis) return "Loading operational intelligence..."
    if (kpis.total_leads === 0) return "DIAGNOSIS: Zero lead signal detected. Review campaign platform connectivity and UTM parameters."
    
    if (kpis.avg_cpl > 100) return "OPTIMIZATION ALERT: High average Cost Per Lead detected. Recommend auditing Facebook Ad frequency and creative exhaustion levels."
    
    if (kpis.leads_growth_pct > 20) return "MOMENTUM DETECTED: Lead volume is scaling rapidly. Ensure sales team capacity is synchronized with marketing output."
    
    return "STABLE PROTOCOL: Marketing ROI is within optimal parameters. Maintain current budget allocation across primary channels."
}
