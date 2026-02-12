import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Plus, Package, Trash2, Box, Info } from 'lucide-react'
import { useAllocateMaterialMutation, useRemoveAllocatedMaterialMutation } from '@/features/projects/projectsApi'
import { useGetInventoryQuery } from '@/features/inventory/inventoryApi'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProjectMaterialsTab({ project }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [removeMaterial] = useRemoveAllocatedMaterialMutation()
    
    const materials = project.materials || []
    const totalMaterialCost = materials.reduce((s, m) => s + Number(m.total_cost || 0), 0)

    const handleRemove = async (allocationId) => {
        if (confirm("Remove this material and return it to stock?")) {
            try {
                await removeMaterial(allocationId).unwrap()
                toast.success("Material removed and stock restored")
            } catch (error) {
                toast.error(error.message)
            }
        }
    }

    return (
        <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-gray-500">Allocated Items</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-white">{materials.length} SKUs</div></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-gray-500">Total Material Cost</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-neon-purple">${totalMaterialCost.toLocaleString()}</div></CardContent>
                </Card>
            </div>

            <Card className="bg-glass-bg border-glass-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <Package className="h-5 w-5 text-neon-purple" /> Deployed Materials
                    </CardTitle>
                    <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-neon-purple text-black font-black uppercase text-[10px]">
                        <Plus className="h-3 w-3 mr-1" /> Allocate stock
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Material Name</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">SKU / Brand</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Quantity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Unit Cost</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500 text-right">Total</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((m) => (
                                <TableRow key={m.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-bold text-white uppercase">{m.materials?.name}</TableCell>
                                    <TableCell className="text-gray-500 font-mono text-[10px] uppercase">{m.materials?.brand || 'N/A'}</TableCell>
                                    <TableCell className="text-neon-cyan font-black">{m.quantity} {m.materials?.unit || 'pcs'}</TableCell>
                                    <TableCell className="text-gray-400 font-mono text-xs">${Number(m.unit_cost || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-black text-white">${Number(m.total_cost || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemove(m.id)} className="h-8 w-8 text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {materials.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-500 font-bold uppercase text-xs">No materials assigned to this project</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AllocateMaterialModal open={isModalOpen} setOpen={setIsModalOpen} projectId={project.id} />
        </div>
    )
}

function AllocateMaterialModal({ open, setOpen, projectId }) {
    const { data: inventoryData } = useGetInventoryQuery({ page: 1, limit: 100 })
    const [allocate, { isLoading }] = useAllocateMaterialMutation()
    
    const [formData, setFormData] = useState({
        material_id: '',
        quantity: '',
    })

    const inventory = inventoryData?.materials || []

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await allocate({ 
                project_id: projectId, 
                material_id: formData.material_id, 
                quantity: Number(formData.quantity) 
            }).unwrap()
            toast.success("Stock allocated to project")
            setOpen(false)
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black/95 border-white/10 text-white">
                <DialogHeader><DialogTitle className="uppercase font-black italic text-neon-purple">Allocate Inventory</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Inventory Item</Label>
                        <Select onValueChange={val => setFormData({...formData, material_id: val})}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select material from stock" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10 text-white">
                                {inventory.map(item => (
                                    <SelectItem key={item.material_id} value={item.material_id}>
                                        <div className="flex justify-between items-center w-full min-w-[300px]">
                                            <span>{item.name}</span>
                                            <span className="text-[10px] bg-white/5 px-1 rounded ml-2">Stock: {item.quantity}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Quantity to Deploy</Label>
                        <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="bg-white/5 border-white/10" required />
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex gap-3">
                        <Info className="h-5 w-5 text-neon-blue shrink-0" />
                        <p className="text-[10px] text-blue-200/70 font-bold uppercase tracking-tight">
                            Allocating stock will automatically deduct quantity from inventory and calculate total cost based on current unit price.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-neon-purple text-black font-black uppercase tracking-widest w-full">Confirm Allocation</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
