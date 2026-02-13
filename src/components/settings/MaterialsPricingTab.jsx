import React, { useState } from 'react'
import { useMaterialsSettings, useMaterialMutations } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Boxes, 
    Plus, 
    Trash2, 
    Edit, 
    MoreVertical, 
    Loader2,
    DollarSign,
    Package,
    AlertTriangle,
    Save,
    TrendingUp
} from 'lucide-react'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'

const materialSchema = z.object({
    name: z.string().min(2, "Name is required"),
    brand: z.string().optional(),
    unit: z.string().default('pcs'),
    unit_cost: z.number().min(0),
    unit_price: z.number().min(0),
})

const stockSchema = z.object({
    reorder_level: z.number().min(0),
})

export function MaterialsPricingTab() {
    const { data: materials, isLoading } = useMaterialsSettings()
    const { createMaterial, updateMaterial, deleteMaterial, updateStock } = useMaterialMutations()
    
    const [materialModal, setMaterialModal] = useState({ open: false, mode: 'add', data: null })
    const [stockModal, setStockModal] = useState({ open: false, data: null })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const matForm = useForm({
        resolver: zodResolver(materialSchema),
        defaultValues: { unit: 'pcs', unit_cost: 0, unit_price: 0 }
    })

    const stockForm = useForm({
        resolver: zodResolver(stockSchema)
    })

    const onAddEditMaterial = (mode, data = null) => {
        setMaterialModal({ open: true, mode, data })
        matForm.reset({
            name: data?.name || '',
            brand: data?.brand || '',
            unit: data?.unit || 'pcs',
            unit_cost: data?.unit_cost || 0,
            unit_price: data?.unit_price || 0,
        })
    }

    const onEditStock = (data) => {
        setStockModal({ open: true, data })
        stockForm.reset({
            reorder_level: data.inventory_stock?.[0]?.reorder_level || 0
        })
    }

    const onMaterialSubmit = async (formData) => {
        try {
            if (materialModal.mode === 'add') {
                await createMaterial.mutateAsync(formData)
                toast.success("Material added")
            } else {
                await updateMaterial.mutateAsync({ id: materialModal.data.id, ...formData })
                toast.success("Material updated")
            }
            setMaterialModal({ open: false, mode: 'add', data: null })
        } catch (error) {
            toast.error("Process failed")
        }
    }

    const onStockSubmit = async (formData) => {
        try {
            await updateStock.mutateAsync({ 
                material_id: stockModal.data.id, 
                reorder_level: formData.reorder_level 
            })
            toast.success("Reorder level updated")
            setStockModal({ open: false, data: null })
        } catch (error) {
            toast.error("Failed to update stock settings")
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return
        try {
            await deleteMaterial.mutateAsync(deleteConfirm.id)
            toast.success("Material removed")
            setDeleteConfirm(null)
        } catch (error) {
            toast.error(error.message || "Failed to remove material")
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neon-blue" /></div>

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-white/[0.02] gap-4 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                            <Boxes className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-white uppercase italic tracking-tighter">Inventory & Logistics</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs">Configure material units and market pricing.</CardDescription>
                        </div>
                    </div>
                    <Button onClick={() => onAddEditMaterial('add')} className="w-full sm:w-auto bg-neon-blue text-black hover:bg-neon-blue/80 font-bold uppercase text-xs tracking-widest h-10">
                        <Plus className="h-4 w-4 mr-2" /> Register Asset
                    </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[700px] md:min-w-full">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest p-4">Material Identity</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-right">Cost Basis</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-right">Market Price</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-center">Stock Threshold</TableHead>
                                    <TableHead className="text-right p-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials?.map((mat) => {
                                    const stock = mat.inventory_stock?.[0]
                                    const isLowStock = (stock?.quantity_available || 0) <= (stock?.reorder_level || 0)

                                    return (
                                        <TableRow key={mat.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <TableCell className="p-4">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-white uppercase italic tracking-tight truncate">{mat.name}</span>
                                                    <span className="text-[10px] text-gray-500 uppercase font-black truncate">{mat.brand || 'Standard'} • {mat.unit}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-gray-400 text-[10px]">
                                                {formatCurrency(mat.unit_cost)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-neon-blue font-black text-[10px]">
                                                {formatCurrency(mat.unit_price)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant="outline" 
                                                    onClick={() => onEditStock(mat)}
                                                    className={`cursor-pointer hover:bg-white/5 font-mono text-[9px] border-none uppercase font-black ${
                                                        isLowStock ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                                                    }`}
                                                >
                                                    Alert @ {stock?.reorder_level || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right p-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-gray-300 font-bold">
                                                        <DropdownMenuItem onClick={() => onAddEditMaterial('edit', mat)} className="gap-2 focus:bg-white/5 focus:text-white text-xs">
                                                            <Edit className="h-4 w-4" /> Modify Spec
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onEditStock(mat)} className="gap-2 focus:bg-white/5 focus:text-white text-xs">
                                                            <Package className="h-4 w-4" /> Stock Control
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem 
                                                            onClick={() => setDeleteConfirm(mat)}
                                                            className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 text-xs"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Terminate Asset
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Material Modal */}
            <Dialog open={materialModal.open} onOpenChange={(v) => !v && setMaterialModal({ ...materialModal, open: false })}>
                <DialogContent className="bg-slate-950 border-white/10 text-white md:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {materialModal.mode === 'add' ? 'New Material' : 'Edit Material Profile'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={matForm.handleSubmit(onMaterialSubmit)} className="space-y-6 pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Material Name *</Label>
                                <Input {...matForm.register('name')} className="bg-white/5 border-white/10" placeholder="e.g. 540W Mono PERC Panel" />
                                {matForm.formState.errors.name && <p className="text-xs text-red-400">{matForm.formState.errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Brand</Label>
                                <Input {...matForm.register('brand')} className="bg-white/5 border-white/10" placeholder="e.g. Luminous / Waaree" />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Input {...matForm.register('unit')} className="bg-white/5 border-white/10" placeholder="pcs, kg, mtrs" />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit Cost (Purchase)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">₹</span>
                                    <Input 
                                        type="number" 
                                        {...matForm.register('unit_cost', { valueAsNumber: true })} 
                                        className="pl-7 bg-white/5 border-white/10 font-mono" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Unit Price (Selling)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-blue font-mono text-xs">₹</span>
                                    <Input 
                                        type="number" 
                                        {...matForm.register('unit_price', { valueAsNumber: true })} 
                                        className="pl-7 bg-white/5 border-white/10 font-mono text-neon-blue font-bold" 
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button variant="ghost" type="button" onClick={() => setMaterialModal({ ...materialModal, open: false })}>Cancel</Button>
                            <Button type="submit" className="bg-neon-blue text-black font-bold">
                                {materialModal.mode === 'add' ? 'Create Material' : 'Update Material'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Stock Alerts Modal */}
            <Dialog open={stockModal.open} onOpenChange={() => setStockModal({ open: false, data: null })}>
                <DialogContent className="bg-slate-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" /> Stock Alerts Configuration
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-4 pt-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
                            <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Material</p>
                            <p className="text-sm font-bold text-white italic">{stockModal.data?.name}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Reorder Level (Safety Stock)</Label>
                            <Input 
                                type="number" 
                                {...stockForm.register('reorder_level', { valueAsNumber: true })} 
                                className="bg-white/5 border-white/10" 
                            />
                            <p className="text-[10px] text-gray-500">System will trigger an alert when stock falls below this value.</p>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button variant="ghost" type="button" onClick={() => setStockModal({ open: false, data: null })}>Cancel</Button>
                            <Button type="submit" className="bg-neon-blue text-black font-bold">
                                Update Alerts
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="bg-slate-950 border-red-500/20 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-400 uppercase tracking-tighter">FATAL REMOVAL</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm italic font-bold">
                            Removing <span className="text-white">"{deleteConfirm?.name}"</span> will erase its pricing and stock configuration.
                            <br/><br/>
                            <span className="text-red-400">NOTE: If this material is referenced in active projects, deletion will fail at the database level.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                            Confirm Removal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
