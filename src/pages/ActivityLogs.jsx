import React, { useState, useMemo } from 'react'
import { 
  useNotifications, 
  useNotificationAnalytics, 
  useMarkAsRead, 
  useMarkAsUnread, 
  useDeleteNotification,
  useNotificationRealtime 
} from '@/hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Bell, 
  BellRing,
  Calendar,
  Download,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  Check,
  X,
  Copy,
  ExternalLink,
  LayoutList,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  DollarSign,
  Users,
  Package,
  Zap,
  Info
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'lead', label: 'Lead' },
  { value: 'payment', label: 'Payment' },
  { value: 'expense', label: 'Expense' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'employee', label: 'Employee' },
  { value: 'system', label: 'System' },
  { value: 'info', label: 'Info' }
]

const READ_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread Only' },
  { value: 'read', label: 'Read Only' }
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'unread', label: 'Unread First' }
]

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const TYPE_COLORS = {
  lead: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  payment: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  expense: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  inventory: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  employee: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  system: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  info: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
}

const TYPE_ICONS = {
  lead: Users,
  payment: DollarSign,
  expense: TrendingUp,
  inventory: Package,
  employee: Users,
  system: Activity,
  info: Info
}

const TYPE_ROUTES = {
  lead: '/leads',
  payment: '/payments',
  expense: '/expenses',
  inventory: '/inventory',
  employee: '/employees',
  project: '/projects',
  quotation: '/quotations',
  invoice: '/invoices'
}

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#06b6d4']

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTypeColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.info
}

function getTypeIcon(type) {
  return TYPE_ICONS[type] || Info
}

function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function exportToCSV(data, filters) {
  const headers = ['Date/Time', 'Type', 'Title', 'Message', 'Read Status']
  const rows = data.map(n => [
    format(new Date(n.created_at), 'yyyy-MM-dd HH:mm:ss'),
    n.type,
    n.title,
    n.message,
    n.is_read ? 'Read' : 'Unread'
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `notifications-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
  toast.success('Exported to CSV')
}

function exportToJSON(data, filters) {
  const json = JSON.stringify({ filters, data }, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `notifications-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  window.URL.revokeObjectURL(url)
  toast.success('Exported to JSON')
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ActivityLogs() {
  // State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [readStatus, setReadStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'timeline'
  const [liveMode, setLiveMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [detailsModal, setDetailsModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [autoMarkRead, setAutoMarkRead] = useState(() => {
    return localStorage.getItem('autoMarkRead') === 'true'
  })

  // Queries
  const filters = useMemo(() => ({
    page,
    limit: pageSize,
    search,
    type,
    readStatus,
    dateFrom,
    dateTo,
    sortBy
  }), [page, pageSize, search, type, readStatus, dateFrom, dateTo, sortBy])

  const { data: notificationsData, isLoading } = useNotifications(filters)
  const { data: analytics, isLoading: analyticsLoading } = useNotificationAnalytics()

  // Mutations
  const markAsRead = useMarkAsRead()
  const markAsUnread = useMarkAsUnread()
  const deleteNotification = useDeleteNotification()

  // Realtime
  useNotificationRealtime(liveMode)

  // Handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(notificationsData?.notifications.map(n => n.id) || [])
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    }
  }

  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) return
    markAsRead.mutate(selectedIds)
    setSelectedIds([])
  }

  const handleBulkMarkUnread = () => {
    if (selectedIds.length === 0) return
    markAsUnread.mutate(selectedIds)
    setSelectedIds([])
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setDeleteConfirm({ ids: selectedIds, bulk: true })
  }

  const handleViewDetails = (notification) => {
    setDetailsModal(notification)
    if (autoMarkRead && !notification.is_read) {
      markAsRead.mutate(notification.id)
    }
  }

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
    toast.success('ID copied to clipboard')
  }

  const handleExportCSV = () => {
    exportToCSV(notificationsData?.notifications || [], filters)
  }

  const handleExportJSON = () => {
    exportToJSON(notificationsData?.notifications || [], filters)
  }

  const handleAutoMarkReadToggle = (checked) => {
    setAutoMarkRead(checked)
    localStorage.setItem('autoMarkRead', checked.toString())
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteNotification.mutate(deleteConfirm.ids)
      setDeleteConfirm(null)
      if (deleteConfirm.bulk) {
        setSelectedIds([])
      }
    }
  }

  // Grouped notifications for timeline view
  const groupedNotifications = useMemo(() => {
    if (!notificationsData?.notifications) return {}
    
    const now = new Date()
    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: []
    }

    notificationsData.notifications.forEach(notification => {
      const date = new Date(notification.created_at)
      const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24))

      if (daysDiff === 0) {
        groups.today.push(notification)
      } else if (daysDiff === 1) {
        groups.yesterday.push(notification)
      } else if (daysDiff <= 7) {
        groups.lastWeek.push(notification)
      } else {
        groups.older.push(notification)
      }
    })

    return groups
  }, [notificationsData])

  const totalPages = Math.ceil((notificationsData?.total || 0) / pageSize)

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            <Bell className="h-8 w-8 md:h-10 md:w-10 text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.4)]" />
            Activity <span className="text-neon-blue">Logs</span>
          </h1>
          <p className="text-muted-foreground text-[10px] md:text-xs mt-2 uppercase tracking-widest font-black opacity-50 italic">
            Enterprise notification center and audit timeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <BellRing className={`h-4 w-4 ${liveMode ? 'text-neon-blue animate-pulse' : 'text-gray-400'}`} />
            <Label htmlFor="live-mode" className="text-xs font-bold cursor-pointer">Live Mode</Label>
            <Switch
              id="live-mode"
              checked={liveMode}
              onCheckedChange={setLiveMode}
            />
          </div>
        </div>
      </header>

      {/* Analytics KPIs */}
      {!analyticsLoading && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px]">TODAY</Badge>
              </div>
              <p className="text-2xl font-black text-white">{analytics.kpis.totalToday}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Notifications</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px]">WEEK</Badge>
              </div>
              <p className="text-2xl font-black text-white">{analytics.kpis.totalWeek}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">This Week</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-4 w-4 text-orange-400" />
                <Badge className="bg-orange-500/10 text-orange-400 border-none text-[8px]">MONTH</Badge>
              </div>
              <p className="text-2xl font-black text-white">{analytics.kpis.totalMonth}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">This Month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <Badge className="bg-red-500/10 text-red-400 border-none text-[8px]">UNREAD</Badge>
              </div>
              <p className="text-2xl font-black text-white">{analytics.kpis.unreadCount}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Pending</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <Badge className="bg-purple-500/10 text-purple-400 border-none text-[8px]">TOP</Badge>
              </div>
              <p className="text-lg font-black text-white uppercase">{analytics.kpis.mostFrequentType}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Most Frequent</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <Badge className="bg-cyan-500/10 text-cyan-400 border-none text-[8px]">LAST</Badge>
              </div>
              <p className="text-xs font-black text-white">
                {analytics.kpis.lastNotification 
                  ? formatDistanceToNow(new Date(analytics.kpis.lastNotification), { addSuffix: true })
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Last Activity</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {!analyticsLoading && analytics && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Daily Trend */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-neon-blue" />
                Daily Activity (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.charts.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-neon-blue" />
                Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.charts.typeDistribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={(entry) => `${entry.type}: ${entry.percentage}%`}
                    labelStyle={{ fontSize: '10px', fill: '#fff' }}
                  >
                    {analytics.charts.typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Read vs Unread */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-neon-blue" />
                Read vs Unread (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.charts.readUnreadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="read" stackId="a" fill="#10b981" />
                  <Bar dataKey="unread" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Controls */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search title or message..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type</Label>
              <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {NOTIFICATION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Read Status */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</Label>
              <Select value={readStatus} onValueChange={(v) => { setReadStatus(v); setPage(1) }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {READ_STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {SORT_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')}
                className="border-white/10 text-white hover:bg-white/5"
              >
                <LayoutList className="h-4 w-4 mr-2" />
                {viewMode === 'table' ? 'Timeline View' : 'Table View'}
              </Button>

              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkRead}
                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Read ({selectedIds.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkUnread}
                    className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Mark Unread ({selectedIds.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedIds.length})
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-white/10">
                  <DropdownMenuItem onClick={handleExportCSV} className="text-white hover:bg-white/5">
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON} className="text-white hover:bg-white/5">
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Label htmlFor="auto-mark-read" className="cursor-pointer">Auto-mark as read</Label>
                <Switch
                  id="auto-mark-read"
                  checked={autoMarkRead}
                  onCheckedChange={handleAutoMarkReadToggle}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === notificationsData?.notifications.length && selectedIds.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-white/20"
                        />
                      </TableHead>
                      <TableHead className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Date/Time</TableHead>
                      <TableHead className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Type</TableHead>
                      <TableHead className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Title</TableHead>
                      <TableHead className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Message</TableHead>
                      <TableHead className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Status</TableHead>
                      <TableHead className="text-gray-400 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificationsData?.notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-gray-500 font-bold italic uppercase tracking-widest text-[10px]">
                          No notifications found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      notificationsData?.notifications.map((notification) => {
                        const typeColor = getTypeColor(notification.type)
                        return (
                          <TableRow 
                            key={notification.id} 
                            className={`border-white/5 hover:bg-white/[0.02] transition-colors ${!notification.is_read ? 'bg-white/[0.01]' : ''}`}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(notification.id)}
                                onChange={(e) => handleSelectOne(notification.id, e.target.checked)}
                                className="rounded border-white/20"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-gray-500 whitespace-nowrap">
                              {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${typeColor.bg} ${typeColor.text} border-none uppercase font-black text-[9px]`}>
                                {notification.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-white text-sm max-w-xs">
                              {truncateText(notification.title, 50)}
                            </TableCell>
                            <TableCell className="text-gray-400 text-xs max-w-md">
                              {truncateText(notification.message, 80)}
                            </TableCell>
                            <TableCell>
                              {notification.is_read ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px]">READ</Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-400 border-none text-[9px]">UNREAD</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                                  <DropdownMenuItem 
                                    onClick={() => handleViewDetails(notification)}
                                    className="text-white hover:bg-white/5 gap-2"
                                  >
                                    <Eye className="h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  {notification.is_read ? (
                                    <DropdownMenuItem 
                                      onClick={() => markAsUnread.mutate(notification.id)}
                                      className="text-orange-400 hover:bg-orange-500/10 gap-2"
                                    >
                                      <X className="h-4 w-4" /> Mark Unread
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => markAsRead.mutate(notification.id)}
                                      className="text-emerald-400 hover:bg-emerald-500/10 gap-2"
                                    >
                                      <Check className="h-4 w-4" /> Mark Read
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleCopyId(notification.id)}
                                    className="text-white hover:bg-white/5 gap-2"
                                  >
                                    <Copy className="h-4 w-4" /> Copy ID
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteConfirm({ ids: [notification.id], bulk: false })}
                                    className="text-red-400 hover:bg-red-500/10 gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
            </div>
          ) : (
            <>
              {Object.entries(groupedNotifications).map(([group, notifications]) => {
                if (notifications.length === 0) return null
                
                const groupTitles = {
                  today: 'Today',
                  yesterday: 'Yesterday',
                  lastWeek: 'Last 7 Days',
                  older: 'Older'
                }

                return (
                  <div key={group}>
                    <h3 className="text-lg font-bold text-white uppercase italic mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-neon-blue" />
                      {groupTitles[group]}
                      <Badge className="bg-white/5 text-gray-400 border-none text-[10px]">{notifications.length}</Badge>
                    </h3>
                    <div className="space-y-3">
                      {notifications.map((notification) => {
                        const typeColor = getTypeColor(notification.type)
                        const Icon = getTypeIcon(notification.type)
                        
                        return (
                          <Card 
                            key={notification.id} 
                            className={`bg-white/5 border-white/10 hover:border-white/20 transition-all cursor-pointer ${!notification.is_read ? 'border-l-4 border-l-neon-blue' : ''}`}
                            onClick={() => handleViewDetails(notification)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${typeColor.bg} border ${typeColor.border} shrink-0`}>
                                  <Icon className={`h-5 w-5 ${typeColor.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                                      <Badge className={`${typeColor.bg} ${typeColor.text} border-none uppercase font-black text-[8px]`}>
                                        {notification.type}
                                      </Badge>
                                      {notification.is_read ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px]">READ</Badge>
                                      ) : (
                                        <Badge className="bg-red-500/10 text-red-400 border-none text-[8px]">UNREAD</Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                                      {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400">{notification.message}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && notificationsData && notificationsData.total > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-400">Rows per page:</Label>
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="w-20 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, notificationsData.total)} of {notificationsData.total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-xs text-gray-400 px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={!!detailsModal} onOpenChange={(open) => !open && setDetailsModal(null)}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl">
          {detailsModal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-neon-blue" />
                  Notification Details
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {format(new Date(detailsModal.created_at), 'PPpp')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-widest">Type</Label>
                  <div className="mt-1">
                    <Badge className={`${getTypeColor(detailsModal.type).bg} ${getTypeColor(detailsModal.type).text} border-none uppercase font-black`}>
                      {detailsModal.type}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-widest">Title</Label>
                  <p className="mt-1 text-white font-bold">{detailsModal.title}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-widest">Message</Label>
                  <p className="mt-1 text-gray-300">{detailsModal.message}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-widest">Status</Label>
                  <div className="mt-1">
                    {detailsModal.is_read ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none">READ</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-none">UNREAD</Badge>
                    )}
                  </div>
                </div>

                {TYPE_ROUTES[detailsModal.type] && (
                  <div className="pt-4 border-t border-white/10">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Quick Navigation</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = TYPE_ROUTES[detailsModal.type]}
                      className="border-neon-blue/20 text-neon-blue hover:bg-neon-blue/10"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Go to {detailsModal.type.charAt(0).toUpperCase() + detailsModal.type.slice(1)}s Page
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyId(detailsModal.id)}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ID
                </Button>
                {detailsModal.is_read ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      markAsUnread.mutate(detailsModal.id)
                      setDetailsModal(null)
                    }}
                    className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Mark Unread
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      markAsRead.mutate(detailsModal.id)
                      setDetailsModal(null)
                    }}
                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteConfirm({ ids: [detailsModal.id], bulk: false })
                    setDetailsModal(null)
                  }}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deleteConfirm?.bulk 
                ? `Are you sure you want to delete ${deleteConfirm.ids.length} notification(s)? This action cannot be undone.`
                : 'Are you sure you want to delete this notification? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
