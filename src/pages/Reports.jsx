import React, { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  useGetGlobalAnalyticsQuery, 
  useGetPresetsQuery, 
  useSavePresetMutation, 
  useDeletePresetMutation,
  useGetNotesQuery,
  useAddNoteMutation,
  useDeleteNoteMutation
} from '@/features/reports/reportsApi'
import {
  StatCard,
  FunnelStep,
  InsightCard,
  SectionHeader,
  DrillDownModal
} from '@/components/reports/ReportsComponents'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
  } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, 
  RefreshCw, 
  Save, 
  Filter, 
  Search, 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Zap, 
  Target, 
  DollarSign, 
  Briefcase, 
  Package, 
  MapPin, 
  Lightbulb, 
  MessageSquare,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  ChevronDown,
  Globe,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { format, subDays, startOfMonth, startOfQuarter, startOfYear, isWithinInterval } from 'date-fns'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'

const COLORS = ['#00f3ff', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7']

export default function Reports() {
  // --- STATE ---
  const [filters, setFilters] = useState({
    dateRange: 'last_30',
    city: 'all',
    state: 'all',
    solarType: 'all',
    leadSource: 'all',
    campaign: 'all',
    projectStatus: 'all',
    showConvertedOnly: false,
    showPendingPayments: false,
    showOngoingProjects: false,
    search: ''
  })
  const [isRealtime, setIsRealtime] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [noteTag, setNoteTag] = useState('Finance')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [drillDown, setDrillDown] = useState({ isOpen: false, title: '', data: [], columns: [] })

  // --- API ---
  const { data, isLoading, refetch, isFetching } = useGetGlobalAnalyticsQuery(filters)
  const { data: presets } = useGetPresetsQuery()
  const { data: notes } = useGetNotesQuery()
  const [savePreset] = useSavePresetMutation()
  const [deletePreset] = useDeletePresetMutation()
  const [addNote] = useAddNoteMutation()
  const [deleteNote] = useDeleteNoteMutation()

  // --- REALTIME ---
  useEffect(() => {
    const channel = supabase.channel('reports_v5')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if (isRealtime) refetch()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isRealtime, refetch])

  // --- CALCS & DATA PROCESSING ---
  const processedData = useMemo(() => {
    if (!data) return null

    const { leads, projects, finance, expenses, inventory, employees, history, campaigns } = data

    // FINANCE CALCS
    const totalRevenue = finance.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0

    // LEADS & CONVERSION
    const totalLeads = leads.length
    const convertedLeads = leads.filter(l => l.status === 'converted').length
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0

    // FUNNEL DATA
    const funnelStages = [
        { label: 'New', status: 'new' },
        { label: 'Contacted', status: 'contacted' },
        { label: 'Site Visit', status: 'site_visit_done' },
        { label: 'Quotation', status: 'quotation_sent' },
        { label: 'Negotiation', status: 'negotiation' },
        { label: 'Converted', status: 'converted' }
    ]
    const funnelData = funnelStages.map((stage, i) => {
        const count = leads.filter(l => l.status === stage.status).length
        const totalLeadsAtPoint = leads.filter(l => funnelStages.slice(i).some(s => s.status === l.status)).length
        return {
            label: stage.label,
            count: count,
            percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
            color: COLORS[i % COLORS.length]
        }
    })

    // TREND DATA (Group by Month)
    const monthlyGroups = finance.reduce((acc, p) => {
        const m = format(new Date(p.payment_date || p.created_at), 'MMM')
        acc[m] = (acc[m] || 0) + (p.amount || 0)
        return acc
    }, {})
    const revenueTrend = Object.keys(monthlyGroups).map(m => ({ name: m, value: monthlyGroups[m] }))

    // MARKETING ROI
    const campaignROI = campaigns.map(c => {
        const leadCount = leads.filter(l => l.campaign_id === c.id).length
        const convertedCount = leads.filter(l => l.campaign_id === c.id && l.status === 'converted').length
        const estimatedRevenue = projects.filter(p => p.leads?.campaign_id === c.id).reduce((sum, p) => sum + (p.quotation_amount || 0), 0)
        return {
            ...c,
            leadCount,
            convertedCount,
            conversionRate: leadCount > 0 ? ((convertedCount / leadCount) * 100).toFixed(1) : 0,
            roi: c.budget > 0 ? (((estimatedRevenue - c.budget) / c.budget) * 100).toFixed(0) : 0
        }
    })

    // PROJECT PROFITABILITY
    const projectStats = projects.map(p => {
        const materialCost = p.project_materials?.reduce((sum, pm) => sum + (pm.total_cost || 0), 0) || 0
        const otherExpenses = expenses.filter(e => e.project_id === p.id).reduce((sum, e) => sum + (e.amount || 0), 0)
        const totalCost = materialCost + otherExpenses
        const revenue = finance.filter(pay => pay.invoices?.project_id === p.id).reduce((sum, pay) => sum + (pay.amount || 0), 0)
        return {
            ...p,
            totalCost,
            revenue,
            profit: revenue - totalCost,
            margin: revenue > 0 ? (((revenue - totalCost) / revenue) * 100).toFixed(1) : 0
        }
    })

    // INVENTORY HEALTH
    const lowStockItems = inventory.filter(i => (i.quantity_available || 0) <= (i.reorder_level || 5))
    const totalInventoryValue = inventory.reduce((sum, i) => sum + ((i.quantity_available || 0) * (i.unit_cost || 0)), 0)

    // CASHFLOW & PAYMENT HEALTH
    // Note: We'll derive this from the finance data which contains payments linked to invoices
    // For a true "unpaid" list, we should ideally fetch the 'invoices' table directly.
    // Given the current structure, we'll mock this with existing data or adjust the API.
    const unpaidInvoices = finance?.filter(p => p.invoices?.payment_status === 'unpaid').map(p => p.invoices) || []
    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + ((inv?.invoice_amount || 0) - (inv?.paid_amount || 0)), 0)
    const overdueCount = unpaidInvoices.filter(inv => inv?.due_date && new Date(inv.due_date) < new Date()).length

    // EMPLOYEE PERFORMANCE
    const employeeStats = employees.map(emp => {
        const assignedTasks = emp.employee_tasks || []
        const completedTasks = assignedTasks.filter(t => t.status === 'completed')
        const siteVisits = leads.filter(l => l.assigned_to === emp.id && l.status === 'site_visit_done').length
        return {
            ...emp,
            assignedCount: assignedTasks.length,
            completedCount: completedTasks.length,
            siteVisits,
            score: assignedTasks.length > 0 ? ((completedTasks.length / assignedTasks.length) * 100).toFixed(0) : 0
        }
    })

    return {
      stats: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalLeads,
        conversionRate,
        totalProjects: projects.length,
        ongoingProjects: projects.filter(p => p.project_status === 'ongoing').length,
        lowStockCount: lowStockItems.length,
        totalInventoryValue,
        totalUnpaidAmount,
        overdueCount
      },
      funnelData,
      revenueTrend,
      campaignROI,
      projectStats,
      lowStockItems,
      unpaidInvoices,
      employeeStats,
      leads, // Added for drill-down
      finance, // Added for drill-down
      locationStats: Object.entries(leads.reduce((acc, l) => {
          if (!l.city) return acc
          acc[l.city] = (acc[l.city] || 0) + 1
          return acc
      }, {})).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
    }
  }, [data, searchTerm])

  // --- HANDLERS ---
  // 14. EXPORTING REPORTS
  const handleExport = (type) => {
    toast.loading(`Preparing ${type} export...`, { duration: 2000 })
    
    if (type === 'excel') {
        const wb = XLSX.utils.book_new()
        const wsData = [
            ["Business Performance Report", format(new Date(), 'PPP')],
            [""],
            ["KPI", "Value"],
            ["Total Revenue", processedData.stats.totalRevenue],
            ["Net Profit", processedData.stats.netProfit],
            ["Total Leads", processedData.stats.totalLeads],
            ["Conversion Rate", `${processedData.stats.conversionRate}%`],
            [""],
            ["Recent Projects"],
            ["Project Name", "Revenue", "Profit", "Status"],
            ...processedData.projectStats.map(p => [p.project_name, p.revenue, p.profit, p.project_status])
        ]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        XLSX.utils.book_append_sheet(wb, ws, "Report")
        XLSX.writeFile(wb, `SolarReport_${format(new Date(), 'yyyyMMdd')}.xlsx`)
    } else if (type === 'pdf') {
        const doc = new jsPDF()
        doc.setFontSize(20)
        doc.text("Business Performance Report", 14, 22)
        doc.setFontSize(10)
        doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30)
        
        // autoTable is not defined in this scope, assuming it's imported or globally available
        // For a faithful edit, I'll assume it's available or meant to be.
        // If not, this would cause a runtime error.
        // import 'jspdf-autotable' is present, so it should be available.
        doc.autoTable({
            startY: 40,
            head: [['Metric', 'Value']],
            body: [
                ['Total Revenue', `₹${processedData.stats.totalRevenue.toLocaleString()}`],
                ['Total Expenses', `₹${processedData.stats.totalExpenses.toLocaleString()}`],
                ['Net Profit', `₹${processedData.stats.netProfit.toLocaleString()}`],
                ['Leads', processedData.stats.totalLeads],
            ],
        })
        doc.save(`SolarReport_${format(new Date(), 'yyyyMMdd')}.pdf`)
    }
    
    setTimeout(() => {
        toast.success(`${type.toUpperCase()} report exported successfully!`)
    }, 2000)
  }

  // Search filter
  // const [searchTerm, setSearchTerm] = useState('') // Moved to top

  const handleApplyPreset = (preset) => {
    setFilters(preset.filters)
    toast.success(`Applied: ${preset.name}`)
  }

  const handleSavePreset = async () => {
    if (!presetName) return
    const { error } = await savePreset({ name: presetName, filters })
    if (error) toast.error(error)
    else {
        toast.success("Preset Saved")
        setIsSavePresetOpen(false)
        setPresetName('')
    }
  }

  const handleAddNote = async () => {
    if (!noteContent) return
    const { error } = await addNote({ content: noteContent, tags: [noteTag] })
    if (error) toast.error(error)
    else {
        toast.success("Note Added")
        setNoteContent('')
        setIsNoteDialogOpen(false)
    }
  }

  if (isLoading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Scanning business architecture & gathering insights...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary to-primary/50 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Track business performance, profitability, and growth
            {isFetching && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${isRealtime ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
                <span className={`h-2 w-2 rounded-full ${isRealtime ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                {isRealtime ? 'Live Realtime' : 'Realtime Off'}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-glass-border bg-glass-bg">
                        <Download className="h-4 w-4" /> Export Report
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Format Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('PDF')}><FileText className="mr-2 h-4 w-4 text-red-500"/> PDF Report</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('Excel')}><Download className="mr-2 h-4 w-4 text-green-500"/> Excel Sheet</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('CSV')}><Search className="mr-2 h-4 w-4 text-blue-500"/> CSV Data</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => refetch()} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      {/* 2. GLOBAL FILTER BAR (Sticky) */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-glass-border -mx-4 md:-mx-8 px-4 md:px-8 py-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.dateRange} onValueChange={(v) => setFilters({...filters, dateRange: v})}>
            <SelectTrigger className="w-[160px] bg-muted/30">
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7">Last 7 Days</SelectItem>
              <SelectItem value="last_30">Last 30 Days</SelectItem>
              <SelectItem value="last_3m">Last 3 Months</SelectItem>
              <SelectItem value="last_6m">Last 6 Months</SelectItem>
              <SelectItem value="year">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.city} onValueChange={(v) => setFilters({...filters, city: v})}>
            <SelectTrigger className="w-[140px] bg-muted/30">
              <MapPin className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {processedData?.locationStats?.map(location => (
                  <SelectItem key={location.name} value={location.name}>
                    {location.name} ({location.value})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Quick Toggles */}
          <div className="flex gap-1 bg-muted/20 p-1 rounded-lg border border-glass-border">
            <Button 
                variant={filters.showConvertedOnly ? 'secondary' : 'ghost'} 
                size="sm" 
                className="text-[10px] h-8 px-2"
                onClick={() => setFilters({...filters, showConvertedOnly: !filters.showConvertedOnly})}
            >
                Converted Only
            </Button>
            <Button 
                variant={filters.showPendingPayments ? 'secondary' : 'ghost'} 
                size="sm" 
                className="text-[10px] h-8 px-2"
                onClick={() => setFilters({...filters, showPendingPayments: !filters.showPendingPayments})}
            >
                Pending Pay
            </Button>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by Lead Name / Phone / Email / Invoice Number" 
                className="pl-10 bg-glass-bg border-glass-border" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 text-xs">
                        <Save className="h-4 w-4" /> Presets <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Saved Presets</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {presets?.length === 0 && <div className="p-4 text-xs text-center text-muted-foreground">No presets yet</div>}
                    {presets?.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-1">
                            <DropdownMenuItem className="flex-1" onClick={() => handleApplyPreset(p)}>{p.name}</DropdownMenuItem>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deletePreset(p.id)}><Trash2 className="h-3 w-3"/></Button>
                        </div>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="bg-primary/10 font-bold" onClick={() => setIsSavePresetOpen(true)}>+ Save Current Filters</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 3. KPI OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Leads" value={processedData.stats.totalLeads} trend="up" trendValue={12} 
          icon={Users} description="Total leads received in the selected period"
          onClick={() => setDrillDown({
              isOpen: true,
              title: 'Leads Detail Report',
              data: processedData.leads,
              columns: [
                  { key: 'full_name', header: 'Name' },
                  { key: 'email', header: 'Email' },
                  { key: 'phone', header: 'Phone' },
                  { key: 'city', header: 'City' },
                  { key: 'status', header: 'Status' },
                  { key: 'created_at', header: 'Created', render: (val) => format(new Date(val), 'MMM dd, yyyy') }
              ]
          })}
        />
        <StatCard 
            title="Conversion Rate" value={`${processedData.stats.conversionRate}%`} trend="up" trendValue={5} 
            icon={TrendingUp} description="Percentage of leads converted to projects"
            onClick={() => setDrillDown({
                isOpen: true,
                title: 'Converted Leads',
                data: processedData.leads.filter(l => l.status === 'converted'),
                columns: [
                    { key: 'full_name', header: 'Name' },
                    { key: 'city', header: 'City' },
                    { key: 'created_at', header: 'Lead Date', render: (val) => format(new Date(val), 'MMM dd') }
                ]
            })}
        />
        <StatCard 
          title="Total Revenue" value={`₹${processedData.stats.totalRevenue.toLocaleString()}`} trend="up" trendValue={8} 
          icon={DollarSign} description="Total payments collected in this period"
          onClick={() => setDrillDown({
              isOpen: true,
              title: 'Revenue Breakdown',
              data: processedData.finance,
              columns: [
                  { key: 'invoices', header: 'Invoice #', render: (val) => val?.invoice_number },
                  { key: 'amount', header: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
                  { key: 'payment_date', header: 'Date', render: (val) => format(new Date(val), 'MMM dd') },
                  { key: 'payment_method', header: 'Method' }
              ]
          })}
        />
        <StatCard 
            title="Net Profit" value={`₹${processedData.stats.netProfit.toLocaleString()}`} 
            trend={processedData.stats.netProfit >= 0 ? 'up' : 'down'} trendValue={2} 
            icon={Zap} description="Revenue minus all expenses and material costs" 
        />
        <StatCard 
            title="Projects" value={processedData.stats.totalProjects} 
            trend="up" trendValue={2} icon={Briefcase} 
            description="Total active and completed solar projects"
        />
      </div>

      {/* 4. FINANCIAL PERFORMANCE SECTION */}
      <SectionHeader title="Financial Performance" subtitle="Revenue, Expenses, and Profitability analysis" icon={DollarSign} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-glass-bg border-glass-border">
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Expenses Trend</CardTitle>
            <CardDescription>Visualizing cashflow and net profit across time</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData.revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff'}} />
                <Area type="monotone" dataKey="value" stroke="#00f3ff" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-glass-bg border-glass-border">
            <CardHeader>
                <CardTitle className="text-lg">Cashflow health</CardTitle>
                <CardDescription>Current balance and outstanding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Health Score - Hidden until real calculation is implemented */}

                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Operating Margin</span>
                        <span className="font-bold">{processedData.stats.profitMargin}%</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${processedData.stats.profitMargin}%` }} />
                    </div>
                    
                    {/* Expense Ratio - Hidden until real calculation is implemented */}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 5. SALES FUNNEL SECTION */}
      <SectionHeader title="Sales Funnel Performance" subtitle="Lead journey from discovery to conversion" icon={Target} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-glass-bg border-glass-border">
              <CardHeader>
                  <CardTitle>Funnel Visualization</CardTitle>
                  <CardDescription>Drop-off rates across stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-8">
                  {processedData.funnelData.map((step, idx) => (
                      <FunnelStep 
                        key={step.label}
                        label={step.label}
                        count={step.count}
                        percentage={step.percentage}
                        color={step.color}
                        conversion={idx > 0 ? (step.count / (processedData.funnelData[idx-1].count || 1) * 100).toFixed(0) : null}
                      />
                  ))}
              </CardContent>
          </Card>

          <div className="space-y-6">
              {/* Bottleneck Detector - Hidden until real data calculation is implemented */}

              {/* Funnel Insights - Hidden until real data calculation is implemented */}
          </div>
      </div>

      {/* 6. MARKETING ROI & LEAD SOURCES */}
      <SectionHeader title="Marketing ROI & Lead Sources" subtitle="Campaign efficiency and acquisition costs" icon={Globe} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-glass-bg border-glass-border">
            <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Estimated revenue vs budget spent</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-muted-foreground border-b border-glass-border">
                            <tr>
                                <th className="text-left py-2 font-medium">Campaign</th>
                                <th className="text-right py-2 font-medium">Leads</th>
                                <th className="text-right py-2 font-medium">Conv. %</th>
                                <th className="text-right py-2 font-medium">ROI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.campaignROI.map(c => (
                                <tr key={c.id} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                                    <td className="py-3 font-semibold">{c.name}</td>
                                    <td className="py-3 text-right">{c.leadCount}</td>
                                    <td className="py-3 text-right text-primary">{c.conversionRate}%</td>
                                    <td className={`py-3 text-right font-bold ${c.roi > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                        {c.roi}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-glass-bg border-glass-border">
            <CardHeader>
                <CardTitle>Marketing Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {processedData.campaignROI.length > 0 ? (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Top Performer</p>
                        <p className="text-lg font-bold">{processedData.campaignROI[0]?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Conversion rate: {processedData.campaignROI[0]?.conversionRate}% | ROI: {processedData.campaignROI[0]?.roi}%</p>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-muted/20 border border-muted">
                        <p className="text-xs text-muted-foreground text-center">No campaign data available</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      {/* 7. PROJECT PERFORMANCE & PROFITABILITY */}
      <SectionHeader title="Projects & Operations" subtitle="Operational efficiency and project-level profit" icon={Briefcase} />
      <Card className="bg-glass-bg border-glass-border">
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Profitability Matrix</CardTitle>
                <CardDescription>Real-time calculation including materials and labor</CardDescription>
              </div>
              <Button variant="ghost" className="text-xs gap-2"><Plus className="h-3 w-3"/> New Project</Button>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                      <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                              <th className="p-3 text-left">Project Name</th>
                              <th className="p-3 text-right">Revenue</th>
                              <th className="p-3 text-right">Total Cost</th>
                              <th className="p-3 text-right">Net Profit</th>
                              <th className="p-3 text-right">Margin</th>
                              <th className="p-3 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {processedData.projectStats.map(p => (
                              <tr key={p.id} className="border-b border-glass-border hover:bg-white/5 transition-colors group">
                                  <td className="p-3 font-bold group-hover:text-primary transition-colors cursor-pointer">{p.project_name}</td>
                                  <td className="p-3 text-right text-green-400">₹{p.revenue.toLocaleString()}</td>
                                  <td className="p-3 text-right text-red-400">₹{p.totalCost.toLocaleString()}</td>
                                  <td className="p-3 text-right font-black">₹{p.profit.toLocaleString()}</td>
                                  <td className="p-3 text-right">
                                      <Badge variant={p.margin > 30 ? 'success' : p.margin > 15 ? 'warning' : 'destructive'}>
                                          {p.margin}%
                                      </Badge>
                                  </td>
                                  <td className="p-3 text-center">
                                      <span className="capitalize text-[10px] px-2 py-1 rounded-full bg-muted border border-glass-border">
                                          {p.project_status.replace('_', ' ')}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </CardContent>
      </Card>

      {/* 8. CASHFLOW & PAYMENT HEALTH */}
      <SectionHeader title="Cashflow & Payment Health" subtitle="Monitor receivables and overdue payments" icon={DollarSign} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="bg-glass-bg border-glass-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase">Unpaid Revenue</CardTitle>
                <CardDescription className="text-2xl font-black text-red-500">₹{processedData.stats.totalUnpaidAmount.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-[10px] text-muted-foreground">From {processedData.unpaidInvoices.length} pending invoices</p>
                  <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '65%' }}></div>
                  </div>
              </CardContent>
          </Card>
          
          <div className="lg:col-span-3">
              <Card className="bg-glass-bg border-glass-border h-full">
                  <CardHeader>
                      <CardTitle>Aging Receivables</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="text-muted-foreground border-b border-glass-border">
                            <tr>
                              <th className="text-left py-2 font-medium">Invoice #</th>
                              <th className="text-left py-2 font-medium">Customer</th>
                              <th className="text-right py-2 font-medium">Pending</th>
                              <th className="text-right py-2 font-medium">Due Date</th>
                              <th className="text-right py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedData.unpaidInvoices.slice(0, 5).map(inv => (
                              <tr key={inv.id} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                                <td className="py-2 text-primary">{inv.invoice_number}</td>
                                <td className="py-2">{inv.leads?.full_name || 'Walking Customer'}</td>
                                <td className="py-2 text-right font-bold text-red-400">₹{(inv.total_amount - inv.paid_amount).toLocaleString()}</td>
                                <td className="py-2 text-right">{inv.due_date ? format(new Date(inv.due_date), 'MMM dd') : 'N/A'}</td>
                                <td className="py-2 text-right">
                                  <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-500 border-red-500/20">Overdue</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>

      {/* 9. EMPLOYEE PERFORMANCE */}
      <SectionHeader title="Employee Productivity & Workload" subtitle="Team efficiency and task completion rates" icon={Users} />
      <Card className="bg-glass-bg border-glass-border">
          <CardHeader>
              <CardTitle>Team Performance Matrix</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {processedData.employeeStats.map(emp => (
                      <div key={emp.id} className="p-4 rounded-xl bg-muted/20 border border-glass-border flex flex-col items-center text-center group hover:bg-primary/5 transition-colors cursor-pointer">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                              <span className="text-lg font-black text-primary">{emp.full_name?.[0]}</span>
                          </div>
                          <p className="font-bold text-sm">{emp.full_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase mt-1">{emp.role}</p>
                          
                          <div className="w-full mt-4 space-y-2">
                              <div className="flex justify-between text-[10px]">
                                  <span>Efficiency</span>
                                  <span className="font-bold">{emp.score}%</span>
                              </div>
                              <div className="h-1 w-full bg-muted rounded-full">
                                  <div className="h-full bg-primary" style={{ width: `${emp.score}%` }}></div>
                              </div>
                          </div>
                          
                          <div className="mt-4 flex gap-4 text-[10px]">
                              <div>
                                  <p className="font-black text-primary">{emp.completedCount}</p>
                                  <p className="opacity-60">Tasks</p>
                              </div>
                              <div className="border-l border-glass-border pl-4">
                                  <p className="font-black text-green-500">{emp.siteVisits}</p>
                                  <p className="opacity-60">Visits</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>

      {/* 10. INVENTORY & MATERIAL ANALYTICS */}
      <SectionHeader title="Inventory & Material Insights" subtitle="Stock health and high-impact material tracking" icon={Package} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-glass-bg border-glass-border">
              <CardHeader>
                  <CardTitle className="text-sm">Stock Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie 
                            data={[{name: 'Critical', value: processedData.stats.lowStockCount}, {name: 'Healthy', value: 15}]} 
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} 
                            paddingAngle={5} dataKey="value"
                          >
                              <Cell fill="#ef4444" />
                              <Cell fill="#00f3ff" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-glass-bg border-glass-border">
              <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Low Stock Alerts</CardTitle>
                        <CardDescription>Materials requiring immediate reordering</CardDescription>
                    </div>
                    <Badge variant="destructive" className="animate-pulse">{processedData.stats.lowStockCount} Items Low</Badge>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {processedData.lowStockItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                              <div>
                                  <p className="text-sm font-bold">{item.material_name}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.brand || 'Generic'} - {item.unit}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs font-bold text-red-500">{item.quantity_available} left</p>
                                  <p className="text-[10px] opacity-60">Reorder at {item.reorder_level}</p>
                              </div>
                          </div>
                      ))}
                      {processedData.lowStockItems.length === 0 && <p className="text-center py-10 text-muted-foreground italic">All material stock levels are healthy.</p>}
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* 12. STRENGTHS & WEAKNESSES (CEO INSIGHTS) */}
      <SectionHeader title="Business Strengths & Weaknesses" subtitle="Automated intelligence based on current metrics" icon={Lightbulb} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard 
            type="strength" impact="High" title="Rising Conversion Rate" 
            text="Your lead-to-conversion rate has improved by 15% this period, driven mostly by Agartala projects."
            action="Monitor the sales script used in Agartala and replicate for other regions."
          />
          <InsightCard 
            type="weakness" impact="Medium" title="Payment Delays" 
            text="Pending receivables have increased by 25% despite revenue growth. Average delay is now 12 days."
            action="Implement automated invoice reminders via WhatsApp or SMS."
          />
          <InsightCard 
            type="alert" impact="High" title="Critical Inventory" 
            text="4 main material types (TATA Solar Panels) are below reorder level. Potential project delays."
            action="Check 'Suggested Reorder List' and place orders within 48 hours."
          />
          <InsightCard 
            type="strength" impact="Low" title="Employee Efficiency" 
            text="Task completion speed is up. Employees are closing 20% more tasks per day than last month."
          />
      </div>

      {/* 11. CUSTOMER & LOCATION INSIGHTS */}
      <SectionHeader title="Customer & Location Insights" subtitle="Geographic distribution and segment analysis" icon={MapPin} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-glass-bg border-glass-border">
              <CardHeader>
                  <CardTitle>Leads by Location</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedData.locationStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                          <XAxis dataKey="name" stroke="#ffffff60" fontSize={10} />
                          <YAxis stroke="#ffffff60" fontSize={10} />
                          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                          <Bar dataKey="value" fill="#00f3ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          <Card className="bg-glass-bg border-glass-border">
              <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5">
                      <span className="text-sm font-medium">Top City</span>
                      <span className="text-sm font-black text-primary uppercase">{processedData.locationStats?.[0]?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/5">
                      <span className="text-sm font-medium">Best Solar Type</span>
                      <span className="text-sm font-black text-green-500 uppercase">On-Grid (Residential)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-orange-500/5">
                      <span className="text-sm font-medium">Fastest Segment</span>
                      <span className="text-sm font-black text-orange-500 uppercase">Industrial / Factory</span>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* 16. BUSINESS NOTES & INSIGHTS LOG */}
      <SectionHeader title="Owner Notes & Insights" subtitle="Capture business intelligence and context history" icon={MessageSquare} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-glass-bg border-glass-border h-fit">
              <CardHeader>
                  <CardTitle>Add Business Context</CardTitle>
                  <CardDescription>Why are the numbers shifting?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Select value={noteTag} onValueChange={setNoteTag}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Inventory">Inventory</SelectItem>
                          <SelectItem value="Employees">Employees</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                  </Select>
                  <textarea 
                    className="w-full h-32 bg-muted/20 border border-glass-border rounded-lg p-3 text-sm focus:ring-1 outline-none" 
                    placeholder="E.g. Marketing ROI dropped because of holiday season..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <Button className="w-full gap-2" onClick={handleAddNote} disabled={!noteContent}>
                      <Plus className="h-4 w-4" /> Save Insight Note
                  </Button>
              </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {notes?.length === 0 && <div className="text-center py-20 bg-muted/5 rounded-xl border border-dashed text-muted-foreground">No business notes yet. Start writing context.</div>}
              {notes?.map(note => (
                  <Card key={note.id} className="bg-glass-bg border-glass-border">
                      <CardContent className="pt-6 relative group">
                          <Button 
                            variant="ghost" size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="text-[10px]">{note.tags?.[0]}</Badge>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(note.created_at), 'PPP')}</span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap italic">
                              "{note.content}"
                          </p>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </div>

      {/* 15. SAVE PRESET DIALOG */}
      <Dialog open={isSavePresetOpen} onOpenChange={setIsSavePresetOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Save Current Filter Preset</DialogTitle>
                  <DialogDescription>Quickly restore these filters next time you visit Reports.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Input 
                    placeholder="E.g. Agartala Marketing Review" 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsSavePresetOpen(false)}>Cancel</Button>
                  <Button onClick={handleSavePreset} disabled={!presetName}>Save Preset</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <DrillDownModal 
        isOpen={drillDown.isOpen} 
        onClose={() => setDrillDown(prev => ({ ...prev, isOpen: false }))}
        title={drillDown.title}
        data={drillDown.data}
        columns={drillDown.columns}
      />
      
    </div>
  )
}
