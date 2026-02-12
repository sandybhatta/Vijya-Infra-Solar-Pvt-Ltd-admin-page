import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetProjectDetailsQuery, useAllocateMaterialMutation, useRemoveAllocatedMaterialMutation } from '@/features/projects/projectsApi'
import { useGetInventoryQuery } from '@/features/inventory/inventoryApi'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Calendar, DollarSign, Package, CheckSquare, FileText, Zap, Plus, Trash2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from 'react-hot-toast'

const AllocateMaterialModal = ({ open, setOpen, projectId }) => {
    const [allocateMaterial, { isLoading }] = useAllocateMaterialMutation()
    const { data: invData } = useGetInventoryQuery({ page: 1, limit: 100 })
    const inventory = invData?.materials || []
    
    const [formData, setFormData] = useState({ material_id: '', quantity: 1 })

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await allocateMaterial({ project_id: projectId, ...formData }).unwrap()
            toast.success("Material allocated")
            setOpen(false)
            setFormData({ material_id: '', quantity: 1 })
        } catch (error) {
            toast.error(error.data?.error || "Allocation failed (check stock)")
        }
    }

    const selectedMat = inventory.find(i => i.id === formData.material_id)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-glass-bg border-glass-border">
                <DialogHeader><DialogTitle className="text-white">Allocate Material</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label className="text-gray-300">Material</Label>
                        <Select value={formData.material_id} onValueChange={val => setFormData({...formData, material_id: val})}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select Material" />
                            </SelectTrigger>
                            <SelectContent>
                                {inventory.map(item => (
                                    <SelectItem key={item.id} value={item.id} disabled={item.quantity < 1}>
                                        {item.name} ({item.quantity} avail)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-gray-300">Quantity</Label>
                        <Input type="number" min="1" max={selectedMat?.quantity || 9999} value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="bg-white/5 border-white/10 text-white" />
                        {selectedMat && <p className="text-xs text-gray-500">Max available: {selectedMat.quantity}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-neon-blue text-black font-bold">Allocate</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function ProjectDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: project, isLoading } = useGetProjectDetailsQuery(id)
    const [removeAllocated] = useRemoveAllocatedMaterialMutation()
    
    // Local state for modals/tabs
    const [isAllocModalOpen, setIsAllocModalOpen] = useState(false)

    if (isLoading) return <div className="flex justify-center items-center h-screen text-neon-blue"><Loader2 className="animate-spin h-10 w-10"/></div>
    if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>

    const handleRemoveMaterial = async (m) => {
        if(confirm(`Return ${m.quantity} ${m.materials?.name} to inventory?`)) {
            await removeAllocated({ id: m.id, project_id: id, material_id: m.material_id, quantity: m.quantity })
            toast.success("Material returned")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 space-y-4">
             {/* Header */}
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                     <h1 className="text-2xl font-bold flex items-center gap-2">
                        {project.project_name || project.leads?.name}
                        <Badge variant="outline" className="capitalize">{project.project_status}</Badge>
                     </h1>
                     <p className="text-muted-foreground text-sm flex items-center gap-2">
                        <Calendar className="h-3 w-3"/> {project.start_date ? format(new Date(project.start_date), 'PPP') : 'No date set'} 
                     </p>
                </div>
             </div>

             {/* Tabs */}
             <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-glass-bg border border-glass-border">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <Card className="bg-glass-bg border-glass-border">
                        <CardHeader>
                            <CardTitle>Project Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-400">Client Details</h4>
                                <p className="text-lg">{project.leads?.name}</p>
                                <p className="text-sm text-gray-400">{project.leads?.email}</p>
                                <p className="text-sm text-gray-400">{project.leads?.phone}</p>
                                <p className="text-sm text-gray-400">{project.leads?.city}</p>
                                <p className="text-sm text-gray-400 mt-2 flex items-start gap-2">
                                    <MapPin className="h-4 w-4 shrink-0" /> 
                                    {project.installation_address || 'No address set'}
                                </p>
                            </div>
                             <div>
                                <h4 className="text-sm font-medium text-gray-400">System Details</h4>
                                <p>Type: {project.solar_type || project.leads?.system_type || 'N/A'}</p>
                                <p>Capacity: {project.capacity_kw || project.leads?.capacity_kw || 0} kW</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="financials" className="space-y-4 mt-4">
                    <div className="grid md:grid-cols-4 gap-4">
                        <Card className="bg-glass-bg border-glass-border">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400">Quotation</CardTitle></CardHeader>
                            <CardContent>
                                {project.quotation ? (
                                    <div className="space-y-1">
                                        <div className="text-xl font-bold text-white">${project.quotation.quotation_amount?.toLocaleString()}</div>
                                        <Badge variant={project.quotation.quotation_status === 'accepted' ? 'default' : 'outline'}>{project.quotation.quotation_status}</Badge>
                                    </div>
                                ) : <span className="text-gray-500">Not Linked</span>}
                            </CardContent>
                        </Card>
                        <Card className="bg-glass-bg border-glass-border">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400">Total Invoiced</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-neon-blue">${(project.invoices || []).reduce((s, i) => s + i.amount, 0).toLocaleString()}</div></CardContent>
                        </Card>
                        <Card className="bg-glass-bg border-glass-border">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400">Expenses</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-red-400">${(project.expenses || []).reduce((s, e) => s + e.amount, 0).toLocaleString()}</div></CardContent>
                        </Card>
                         <Card className="bg-glass-bg border-glass-border">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400">Estimated Margin</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-neon-green">
                                ${(
                                    (project.invoices || []).reduce((s, i) => s + i.amount, 0) - 
                                    (project.expenses || []).reduce((s, e) => s + e.amount, 0)
                                ).toLocaleString()}
                            </div></CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="materials" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Allocated Materials</h2>
                        <Button onClick={() => setIsAllocModalOpen(true)} className="bg-neon-blue text-black"><Plus className="mr-2 h-4 w-4"/> Allocate Material</Button>
                    </div>
                    <Card className="bg-glass-bg border-glass-border">
                         <CardContent className="pt-6">
                             {(project.materials || []).length === 0 ? <p className="text-gray-500 text-center py-4">No materials allocated.</p> : (
                                 <div className="space-y-2">
                                     {(project.materials || []).map((m, idx) => (
                                         <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10">
                                             <div>
                                                 <p className="font-medium text-white">{m.materials?.name || 'Unknown Item'}</p>
                                                 <p className="text-xs text-gray-400">Allocated: {format(new Date(m.assigned_at), 'MMM dd')}</p>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <Badge variant="secondary">{m.quantity} Units</Badge>
                                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveMaterial(m)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="tasks" className="space-y-4 mt-4">
                    <Card className="bg-glass-bg border-glass-border">
                         <CardHeader><CardTitle>Installation Tasks</CardTitle></CardHeader>
                         <CardContent>
                              {(project.tasks || []).length === 0 ? <p className="text-gray-500">No tasks created.</p> : (
                                 <div className="space-y-2">
                                     {(project.tasks || []).map((task) => (
                                         <div key={task.id} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10">
                                             <div className="flex items-center gap-3">
                                                 <CheckSquare className={`h-5 w-5 ${task.task_status === 'completed' ? 'text-neon-green' : 'text-gray-500'}`} />
                                                 <div>
                                                     <p className="font-medium">{task.title}</p>
                                                     <p className="text-xs text-gray-400">Assigned to: {task.employees?.name || 'Unassigned'}</p>
                                                 </div>
                                             </div>
                                             <Badge variant={task.task_status === 'completed' ? 'default' : 'outline'}>{task.task_status}</Badge>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </CardContent>
                    </Card>
                </TabsContent>
             </Tabs>

             <AllocateMaterialModal open={isAllocModalOpen} setOpen={setIsAllocModalOpen} projectId={id} />
        </div>
    )
}
