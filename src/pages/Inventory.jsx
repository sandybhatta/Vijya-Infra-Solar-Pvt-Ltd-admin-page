import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  useGetInventoryQuery, 
  useGetInventoryAnalyticsQuery,
  useGetProjectMaterialsQuery,
  useGetUsageTrendsQuery,
  useAddMaterialMutation, 
  useUpdateMaterialMutation, 
  useDeleteMaterialMutation,
  useAdjustStockMutation 
} from '@/features/inventory/inventoryApi'
import { supabase } from '@/lib/supabaseClient'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Filter, 
  Download, 
  RefreshCcw,
  Edit,
  Trash2,
  ArrowRightLeft,
  History,
  TrendingUp,
  Boxes,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// Components
import InventoryAnalyticsCharts from '@/components/inventory/InventoryCharts'
import LowStockAlertPanel from '@/components/inventory/LowStockAlertPanel'
import BusinessInsights from '@/components/inventory/BusinessInsights'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export default function Inventory() {
  const { role } = useSelector((state) => state.auth)
  const isReadOnly = role !== 'admin'

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState('stock')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [brandFilter, setBrandFilter] = useState('all')

  // Usage History State
  const [usagePage, setUsagePage] = useState(1)
  const [usageFilters, setUsageFilters] = useState({ projectId: 'all', status: 'all' })

  // Queries
  const { data: inventoryData, isLoading: isInvLoading, refetch: refetchInv } = useGetInventoryQuery({
    page,
    limit,
    search,
    lowStock: lowStockFilter,
    brand: brandFilter
  })

  const { data: analytics, isLoading: isAnLoading, refetch: refetchAn } = useGetInventoryAnalyticsQuery()
  const { data: usageTrends, isLoading: isTrLoading } = useGetUsageTrendsQuery()
  const { 
    data: usageHistory, 
    isLoading: isUsLoading, 
    refetch: refetchUs 
  } = useGetProjectMaterialsQuery({ 
    page: usagePage, 
    limit: 10,
    ...usageFilters
  })

  // Mutations
  const [addMaterial, { isLoading: isAdding }] = useAddMaterialMutation()
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation()
  const [deleteMaterial] = useDeleteMaterialMutation()
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation()

  // Real-time
  useEffect(() => {
    const stockSub = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_stock' }, () => {
        refetchInv()
        refetchAn()
        toast.success("Stock levels updated", { icon: '📊' })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_materials' }, () => {
        refetchUs()
        refetchAn()
        toast.success("New material consumption recorded", { icon: '🏗️' })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(stockSub)
    }
  }, [])

  // Modal States
  const [materialModal, setMaterialModal] = useState({ open: false, mode: 'add', data: null })
  const [stockModal, setStockModal] = useState({ open: false, data: null })

  // Handlers
  const handleAddEdit = async (formData) => {
    try {
      if (materialModal.mode === 'add') {
        await addMaterial(formData).unwrap()
        toast.success("Material added successfully")
      } else {
        await updateMaterial({ id: materialModal.data.material_id, ...formData }).unwrap()
        toast.success("Material updated successfully")
      }
      setMaterialModal({ open: false, mode: 'add', data: null })
    } catch (error) {
      toast.error(error?.message || "Operation failed")
    }
  }

  const handleStockAdjust = async (formData) => {
    try {
      await adjustStock({ material_id: stockModal.data.material_id, ...formData }).unwrap()
      toast.success("Stock updated successfully")
      setStockModal({ open: false, data: null })
    } catch (error) {
      toast.error(error?.message || "Adjustment failed")
    }
  }

  const handleDelete = async (item) => {
    if (confirm(`Are you sure you want to delete ${item.materials?.name}?`)) {
      try {
        await deleteMaterial(item.material_id).unwrap()
        toast.success("Material deleted")
      } catch (error) {
        toast.error(error?.message || "Delete failed")
      }
    }
  }

  const exportCSV = () => {
    if (!inventoryData?.materials) return
    const headers = ["Name", "Brand", "Quantity", "Unit Cost", "Unit Price", "Value"]
    const rows = inventoryData.materials.map(m => [
      m.materials?.name,
      m.materials?.brand,
      m.quantity_available,
      m.materials?.unit_cost,
      m.materials?.unit_price,
      m.quantity_available * m.materials?.unit_cost
    ])
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `inventory_report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Boxes className="h-8 w-8 text-neon-blue" />
            Inventory Hub
          </h1>
          <p className="text-gray-400 mt-1">Manage, track, and optimize your solar stock.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={exportCSV}
            variant="outline" 
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            disabled={!inventoryData?.materials?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {!isReadOnly && (
            <Button 
              onClick={() => setMaterialModal({ open: true, mode: 'add', data: null })}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-black shadow-lg shadow-neon-blue/20"
            >
              <Plus className="h-5 w-5 mr-1" />
              New Material
            </Button>
          )}
        </div>
      </div>

      <BusinessInsights stats={analytics?.stats} isLoading={isAnLoading} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        <KPICard title="Total Materials" value={analytics?.stats?.totalMaterials} icon={Package} color="blue" />
        <KPICard title="Stock Units" value={analytics?.stats?.totalStockUnits} icon={Boxes} color="emerald" />
        <KPICard title="Low Stock" value={analytics?.stats?.lowStockItems} icon={AlertTriangle} color="red" alert={analytics?.stats?.lowStockItems > 0} />
        <KPICard title="Inventory Cost" value={formatCurrency(analytics?.stats?.totalCostValue)} icon={Wallet} color="purple" />
        <KPICard title="Retail Value" value={formatCurrency(analytics?.stats?.totalSellingValue)} icon={DollarSign} color="cyan" />
        <KPICard title="Potential Profit" value={formatCurrency(analytics?.stats?.potentialProfit)} icon={TrendingUp} color="orange" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
          <TabsTrigger value="stock" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Stock Management</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Usage Analytics</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Project Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Table Section */}
            <div className="xl:col-span-3 space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search material name or brand..." 
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10 text-white">
                    <SelectItem value="all">All Brands</SelectItem>
                    <SelectItem value="Luminous">Luminous</SelectItem>
                    <SelectItem value="Havells">Havells</SelectItem>
                    <SelectItem value="Waaree">Waaree</SelectItem>
                    <SelectItem value="Vikram">Vikram</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant={lowStockFilter ? "destructive" : "outline"}
                  onClick={() => setLowStockFilter(!lowStockFilter)}
                  className={lowStockFilter ? "" : "bg-white/5 border-white/10 text-white"}
                >
                  Low Stock Only
                </Button>
              </div>

              {/* Table */}
              <div className="glass-panel overflow-hidden border border-white/10 rounded-xl bg-white/5">
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-white/5">
                  {isInvLoading ? (
                    <div className="p-8 text-center text-neon-blue animate-pulse font-bold">Loading Inventory...</div>
                  ) : !inventoryData?.materials?.length ? (
                    <div className="p-8 text-center text-gray-500 italic">No materials found</div>
                  ) : (inventoryData?.materials || []).map((item) => (
                    <div key={item.id} className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Package className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white mb-0.5">{item.materials?.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.materials?.brand}</p>
                          </div>
                        </div>
                        <Badge className={
                          item.quantity_available <= 0 ? "bg-red-500/20 text-red-500 border-red-500/30" :
                          item.quantity_available <= item.reorder_level ? "bg-amber-500/20 text-amber-500 border-amber-500/30" :
                          "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                        }>
                          {item.quantity_available} {item.materials?.unit || 'pcs'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Cost Value</p>
                          <p className="text-sm font-bold text-neon-green">₹{(item.quantity_available * item.materials?.unit_cost).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Unit Price</p>
                          <p className="text-sm font-bold text-white">₹{item.materials?.unit_price?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reorder Level: {item.reorder_level}</span>
                        {!isReadOnly && (
                          <div className="flex gap-2">
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-blue-400 bg-white/5 border border-white/10"
                              onClick={() => setMaterialModal({ open: true, mode: 'edit', data: item })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-amber-400 bg-white/5 border border-white/10"
                              onClick={() => setStockModal({ open: true, data: item })}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-red-400 bg-white/5 border border-white/10"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Material</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Stock Level</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Unit Pricing</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Value (Cost)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {isInvLoading ? (
                        <tr><td colSpan="5" className="p-12 text-center text-neon-blue animate-pulse font-bold">Loading Inventory...</td></tr>
                      ) : !inventoryData?.materials?.length ? (
                        <tr>
                          <td colSpan="5" className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="p-6 rounded-full bg-white/5 border border-dashed border-white/10">
                                <Package className="h-12 w-12 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">No Materials Found</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                  {search || lowStockFilter || brandFilter !== 'all' 
                                    ? "Try adjusting your filters to find what you're looking for." 
                                    : "Get started by adding your first material to the inventory."}
                                </p>
                              </div>
                              {!isReadOnly && !search && !lowStockFilter && brandFilter === 'all' && (
                                <Button 
                                  onClick={() => setMaterialModal({ open: true, mode: 'add', data: null })}
                                  className="bg-neon-blue text-black font-bold mt-2"
                                >
                                  Add First Material
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (inventoryData?.materials || []).map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10 hidden md:block">
                                <Package className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-bold text-white group-hover:text-neon-blue transition-colors">
                                  {item.materials?.name}
                                </p>
                                <p className="text-xs text-gray-500">{item.materials?.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={
                                item.quantity_available <= 0 ? "bg-red-500/20 text-red-500 border-red-500/30" :
                                item.quantity_available <= item.reorder_level ? "bg-amber-500/20 text-amber-500 border-amber-500/30" :
                                "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                              }>
                                {item.quantity_available} {item.materials?.unit || 'pcs'}
                              </Badge>
                              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Level: {item.reorder_level}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-white">₹{item.materials?.unit_cost?.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500">Retail: ₹{item.materials?.unit_price?.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-black text-neon-green">
                              ₹{(item.quantity_available * item.materials?.unit_cost).toLocaleString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {!isReadOnly && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-400 hover:bg-blue-500/10"
                                    onClick={() => setMaterialModal({ open: true, mode: 'edit', data: item })}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-amber-400 hover:bg-amber-500/10"
                                    onClick={() => setStockModal({ open: true, data: item })}
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDelete(item)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {inventoryData?.total > 0 && (
                  <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing page {page} of {Math.ceil((inventoryData?.total || 1) / limit)}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="bg-white/5 border-white/10 text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={page >= Math.ceil((inventoryData?.total || 1) / limit)}
                        onClick={() => setPage(p => p + 1)}
                        className="bg-white/5 border-white/10 text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="xl:col-span-1">
              <LowStockAlertPanel lowStockItems={inventoryData?.materials?.filter(m => m.quantity_available <= m.reorder_level) || []} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <InventoryAnalyticsCharts usageData={usageTrends?.top10} distributionData={analytics?.distribution} isLoading={isTrLoading || isAnLoading} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase font-bold">Filter By Project</Label>
                <Select 
                  value={usageFilters.projectId} 
                  onValueChange={v => setUsageFilters({...usageFilters, projectId: v})}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10 text-white">
                    <SelectItem value="all">All Projects</SelectItem>
                    {/* Unique project IDs from history would go here, or a dedicated projects list */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase font-bold">Project Status</Label>
                <Select 
                  value={usageFilters.status} 
                  onValueChange={v => setUsageFilters({...usageFilters, status: v})}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10 text-white">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/5 border-white/10 text-white"
              onClick={() => setUsageFilters({ projectId: 'all', status: 'all' })}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="glass-panel overflow-hidden border border-white/10 rounded-xl bg-white/5">
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {isUsLoading ? (
                <div className="p-12 text-center text-neon-blue animate-pulse">Loading usage history...</div>
              ) : !usageHistory?.consumptions?.length ? (
                <div className="p-12 text-center text-gray-500 italic">No consumption history found</div>
              ) : usageHistory.consumptions.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-base mb-1">{row.projects?.project_name}</p>
                      <Badge className={
                          row.projects?.project_status === 'completed' 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-blue-500/20 text-blue-400"
                      }>
                        {row.projects?.project_status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{format(new Date(row.created_at), 'PP')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5">
                        <History className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-200">{row.materials?.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{row.materials?.brand}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-neon-blue">{row.quantity} {row.materials?.unit || 'pcs'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Project Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Material Used</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Quantity</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date Recorded</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isUsLoading ? (
                    <tr><td colSpan="5" className="p-12 text-center text-neon-blue animate-pulse">Loading usage history...</td></tr>
                  ) : !usageHistory?.consumptions?.length ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-gray-500">
                          <History className="h-12 w-12" />
                          <p className="text-lg font-bold">No consumption history yet</p>
                          <p className="text-sm max-w-xs mx-auto">Material usage for projects will appear here as materials are allocated via project management.</p>
                        </div>
                      </td>
                    </tr>
                  ) : usageHistory.consumptions.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{row.projects?.project_name}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300">{row.materials?.name}</p>
                        <p className="text-[10px] text-gray-500">{row.materials?.brand}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="text-neon-blue border-neon-blue/30">
                          {row.quantity} {row.materials?.unit || 'pcs'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {format(new Date(row.created_at), 'PPP')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={
                             row.projects?.project_status === 'completed' 
                             ? "bg-green-500/20 text-green-400" 
                             : "bg-blue-500/20 text-blue-400"
                        }>
                          {row.projects?.project_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {usageHistory?.total > 0 && (
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <p className="text-sm text-gray-500">Showing {usageHistory.consumptions.length} records</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={usagePage === 1}
                    onClick={() => setUsagePage(p => p - 1)}
                    className="bg-white/5 border-white/10 text-white"
                  >
                    Previous
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={usagePage >= Math.ceil(usageHistory.total / 10)}
                    onClick={() => setUsagePage(p => p + 1)}
                    className="bg-white/5 border-white/10 text-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <MaterialFormModal 
        open={materialModal.open} 
        setOpen={(o) => setMaterialModal(prev => ({ ...prev, open: o }))}
        mode={materialModal.mode}
        data={materialModal.data}
        onSubmit={handleAddEdit}
        isLoading={isAdding || isUpdating}
      />

      <StockAdjustModal 
        open={stockModal.open}
        setOpen={(o) => setStockModal(prev => ({ ...prev, open: o }))}
        data={stockModal.data}
        onSubmit={handleStockAdjust}
        isLoading={isAdjusting}
      />
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, alert }) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    orange: "text-orange-400 bg-orange-500/10"
  }

  return (
    <Card className={`bg-white/5 border-white/10 ${alert ? 'ring-1 ring-red-500/30' : ''}`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          {alert && <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <p className="text-lg md:text-2xl font-black text-white mt-1">{value ?? '---'}</p>
      </CardContent>
    </Card>
  )
}

function MaterialFormModal({ open, setOpen, mode, data, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '', brand: '', unit: 'pcs', unit_cost: '', unit_price: '', initial_stock: '', reorder_level: '10'
  })

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.materials?.name || '',
        brand: data.materials?.brand || '',
        unit: data.materials?.unit || 'pcs',
        unit_cost: data.materials?.unit_cost || '',
        unit_price: data.materials?.unit_price || '',
        initial_stock: data.quantity_available || '',
        reorder_level: data.reorder_level || '10'
      })
    } else {
      setFormData({ name: '', brand: '', unit: 'pcs', unit_cost: '', unit_price: '', initial_stock: '', reorder_level: '10' })
    }
  }, [data, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-neon-blue">
            {mode === 'add' ? 'Add New Material' : 'Edit Material'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Material Name *</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Unit (pcs, meters, etc.)</Label>
              <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost (₹) *</Label>
              <Input required type="number" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (₹)</Label>
              <Input type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            {mode === 'add' && (
              <div className="space-y-2">
                <Label>Initial Stock *</Label>
                <Input required type="number" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: e.target.value})} className="bg-white/5 border-white/10" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Reorder Level *</Label>
              <Input required type="number" value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-gray-400">Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-neon-blue text-black font-bold">
              {isLoading ? "Saving..." : "Save Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StockAdjustModal({ open, setOpen, data, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({ type: 'in', quantity: '', reason: '' })

  useEffect(() => {
    if (open) setFormData({ type: 'in', quantity: '', reason: '' })
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-amber-500" />
            Update Stock Level
          </DialogTitle>
          <p className="text-xs text-gray-500">{data?.materials?.name}</p>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }} className="space-y-4">
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                <SelectItem value="in">Stock In (Add)</SelectItem>
                <SelectItem value="out">Stock Out (Subtract)</SelectItem>
                <SelectItem value="set">Set Exact Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input required type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Reason / Note</Label>
            <Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Purchase order #123" className="bg-white/5 border-white/10" />
          </div>
          <DialogFooter className="mt-4">
             <Button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
               {isLoading ? "Updating..." : "Confirm Adjustment"}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
