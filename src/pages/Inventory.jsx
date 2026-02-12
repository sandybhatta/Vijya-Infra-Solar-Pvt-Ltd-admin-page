import React, { useState } from 'react'
import { useGetInventoryQuery, useAddMaterialMutation, useUpdateMaterialMutation, useDeleteMaterialMutation, useAdjustStockMutation } from '@/features/inventory/inventoryApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Package, AlertTriangle, MoreHorizontal, Edit, Trash2, ArrowRightLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { useSelector } from 'react-redux' // Added
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from 'react-hot-toast'

const MaterialModal = ({ open, setOpen, initialData = null }) => {
    const [addMaterial, { isLoading }] = useAddMaterialMutation()
    const [updateMaterial] = useUpdateMaterialMutation()
    const [formData, setFormData] = useState({ name: '', sku: '', quantity: 0, unit: 'pcs', unit_cost: 0 })

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData)
        } else {
            setFormData({ name: '', sku: '', quantity: 0, unit: 'pcs', unit_cost: 0 })
        }
    }, [initialData, open])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (initialData) {
                await updateMaterial({ id: initialData.id, ...formData }).unwrap()
                toast.success("Material updated")
            } else {
                await addMaterial(formData).unwrap()
                toast.success("Material added")
            }
            setOpen(false)
        } catch (error) {
            toast.error("Operation failed")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
             <DialogContent className="bg-glass-bg border-glass-border">
                <DialogHeader>
                    <DialogTitle className="text-white">{initialData ? 'Edit Material' : 'Add Material'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                     <div className="grid gap-2">
                        <Label>SKU</Label>
                        <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                    </div>
                     {!initialData && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Initial Quantity</Label>
                                <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="bg-white/5 border-white/10 text-white" required />
                            </div>
                             <div className="grid gap-2">
                                <Label>Cost per Unit</Label>
                                <Input type="number" step="0.01" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: parseFloat(e.target.value)})} className="bg-white/5 border-white/10 text-white" />
                            </div>
                        </div>
                     )}
                     {initialData && (
                           <div className="grid gap-2">
                                <Label>Cost per Unit</Label>
                                <Input type="number" step="0.01" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: parseFloat(e.target.value)})} className="bg-white/5 border-white/10 text-white" />
                            </div>
                     )}
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-neon-blue text-black font-bold">Save</Button>
                    </DialogFooter>
                </form>
             </DialogContent>
        </Dialog>
    )
}

const AdjustStockModal = ({ open, setOpen, item }) => {
    const [adjustStock, { isLoading }] = useAdjustStockMutation()
    const [type, setType] = useState('in')
    const [quantity, setQuantity] = useState(1)
    const [reason, setReason] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await adjustStock({ material_id: item.id, quantity, type, reason }).unwrap()
            toast.success("Stock updated")
            setOpen(false)
            setQuantity(1)
            setReason('')
        } catch (error) {
            toast.error("Failed to adjust")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-glass-bg border-glass-border">
                <DialogHeader><DialogTitle className="text-white">Adjust Stock: {item?.name}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <div className="flex gap-2">
                            <Button type="button" variant={type === 'in' ? 'default' : 'outline'} onClick={() => setType('in')} className={type === 'in' ? 'bg-green-600' : ''}>
                                <ArrowUp className="mr-2 h-4 w-4"/> Stock In
                            </Button>
                            <Button type="button" variant={type === 'out' ? 'default' : 'outline'} onClick={() => setType('out')} className={type === 'out' ? 'bg-red-600' : ''}>
                                <ArrowDown className="mr-2 h-4 w-4"/> Stock Out
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Quantity</Label>
                        <Input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="bg-white/5 border-white/10 text-white"/>
                    </div>
                    <div className="grid gap-2">
                        <Label>Reason</Label>
                        <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Restock, Damage, Loss..." className="bg-white/5 border-white/10 text-white"/>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-white text-black font-bold">Confirm Adjustment</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function Inventory() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const { data, isLoading } = useGetInventoryQuery({ page, limit: 20, search })
    const { role } = useSelector((state) => state.auth) // Get role
    
    // Modal States
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    
    const [deleteMaterial] = useDeleteMaterialMutation()

    const handleDelete = async (id) => {
        if(confirm("Delete this item?")) {
            await deleteMaterial(id)
            toast.success("Item deleted")
        }
    }

    const openAdjust = (item) => {
        setSelectedItem(item)
        setIsAdjustModalOpen(true)
    }

    const columns = [
        {
            accessorKey: 'name',
            header: 'Item',
            cell: ({ row }) => (
                <div>
                     <div className="font-medium text-white">{row.getValue('name')}</div>
                     <div className="text-xs text-gray-500">{row.original.sku}</div>
                </div>
            )
        },
        {
            accessorKey: 'quantity',
            header: 'Stock',
            cell: ({ row }) => {
                const qty = row.getValue('quantity')
                const isLow = qty < 10
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant={isLow ? "destructive" : "default"} className={isLow ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-green-500/20 text-green-400 border-green-500/50"}>
                            {qty} {row.original.unit}
                        </Badge>
                        {isLow && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                    </div>
                )
            }
        },
        {
            accessorKey: 'unit_cost',
            header: 'Unit Cost',
            cell: ({ row }) => <span className="text-white">${row.getValue('unit_cost')?.toFixed(2)}</span>
        },
        {
            id: 'value',
            header: 'Total Value',
            cell: ({ row }) => <span className="font-bold text-neon-green">${(row.getValue('quantity') * row.getValue('unit_cost')).toLocaleString()}</span>
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                     {role === 'admin' && (
                        <>
                             <Button variant="ghost" size="icon" title="Adjust Stock" onClick={() => openAdjust(row.original)}><ArrowRightLeft className="h-4 w-4 text-yellow-400"/></Button>
                             <Button variant="ghost" size="icon" title="Edit" onClick={() => { setSelectedItem(row.original); setIsMaterialModalOpen(true) }}><Edit className="h-4 w-4 text-blue-400"/></Button>
                             <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(row.original.id)}><Trash2 className="h-4 w-4 text-red-400"/></Button>
                        </>
                     )}
                </div>
            )
        }
    ]

    return (
        <div className="space-y-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Inventory</h1>
                     <p className="text-gray-400">Stock levels and material costs.</p>
                </div>
                {role === 'admin' && (
                    <Button onClick={() => { setSelectedItem(null); setIsMaterialModalOpen(true) }} className="bg-neon-blue text-black hover:bg-neon-blue/80 font-bold">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                )}
            </div>

            <div className="bg-glass-bg rounded-xl border border-glass-border overflow-hidden p-1">
                 {isLoading ? <div className="p-10 text-center text-neon-blue animate-pulse">Checking Warehouse...</div> : (
                     <DataTable 
                        columns={columns} 
                        data={data?.materials || []} 
                        pageCount={Math.ceil((data?.total || 0) / 20)}
                        searchKey="name"
                     /> 
                 )}
            </div>
            
            <MaterialModal open={isMaterialModalOpen} setOpen={setIsMaterialModalOpen} initialData={selectedItem} />
            <AdjustStockModal open={isAdjustModalOpen} setOpen={setIsAdjustModalOpen} item={selectedItem} />
        </div>
    )
}
