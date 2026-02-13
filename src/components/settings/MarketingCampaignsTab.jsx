import React, { useState } from 'react'
import { useMarketingCampaigns, useMarketingMutations } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Zap, 
    Plus, 
    Trash2, 
    Edit, 
    MoreVertical, 
    Loader2,
    DollarSign,
    Target,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    Save
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
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const campaignSchema = z.object({
    name: z.string().min(2, "Name is required"),
    platform: z.string().min(2, "Platform is required"),
    budget: z.number().min(0),
    status: z.enum(['Active', 'Paused', 'Upcoming', 'Ended']),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
})

export function MarketingCampaignsTab() {
    const { data: campaigns, isLoading } = useMarketingCampaigns()
    const { createCampaign, updateCampaign, deleteCampaign } = useMarketingMutations()
    const [modalState, setModalState] = useState({ open: false, mode: 'add', data: null })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(campaignSchema),
        defaultValues: { status: 'Active', budget: 0 }
    })

    const onAddEdit = (mode, data = null) => {
        setModalState({ open: true, mode, data })
        reset({
            name: data?.name || '',
            platform: data?.platform || '',
            budget: data?.budget || 0,
            status: data?.status || 'Active',
            start_date: data?.start_date ? data.start_date.split('T')[0] : '',
            end_date: data?.end_date ? data.end_date.split('T')[0] : '',
        })
    }

    const onSubmit = async (formData) => {
        try {
            if (modalState.mode === 'add') {
                await createCampaign.mutateAsync(formData)
                toast.success("Campaign deployed")
            } else {
                await updateCampaign.mutateAsync({ id: modalState.data.id, ...formData })
                toast.success("Campaign updated")
            }
            setModalState({ open: false, mode: 'add', data: null })
        } catch (error) {
            toast.error("Process failed")
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return
        try {
            await deleteCampaign.mutateAsync(deleteConfirm.id)
            toast.success("Campaign decomissioned")
            setDeleteConfirm(null)
        } catch (error) {
            toast.error("Failed to remove campaign")
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
                        <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                            <Zap className="h-5 w-5 text-pink-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-white uppercase italic tracking-tighter">Growth Campaigns</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs">Monitor marketing ROI and channel performance.</CardDescription>
                        </div>
                    </div>
                    <Button onClick={() => onAddEdit('add')} className="w-full sm:w-auto bg-neon-blue text-black hover:bg-neon-blue/80 font-bold uppercase text-xs tracking-widest h-10">
                        <Plus className="h-4 w-4 mr-2" /> New Strategy
                    </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[700px] md:min-w-full">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest p-4">Campaign Intel</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-right">Budget Allocation</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-center">ROI Stats</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest">Protocol Status</TableHead>
                                    <TableHead className="text-right p-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns?.map((camp) => (
                                    <TableRow key={camp.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="p-4">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-white uppercase italic tracking-tight truncate">{camp.name}</span>
                                                <span className="text-[10px] text-gray-500 uppercase font-black truncate">{camp.platform}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-gray-300 text-[10px]">
                                            {formatCurrency(camp.budget)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                <Badge variant="outline" className="text-[9px] border-neon-blue/20 text-neon-blue font-black uppercase">
                                                    {camp.total_leads} Leads
                                                </Badge>
                                                <span className="text-[10px] text-emerald-400 font-bold italic">{camp.conversion_rate}% Conv.</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`uppercase text-[9px] font-black tracking-widest ${
                                                camp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-none' :
                                                camp.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-400 border-none' :
                                                'bg-white/5 text-gray-400 border-none'
                                            }`}>
                                                {camp.status}
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
                                                    <DropdownMenuItem onClick={() => onAddEdit('edit', camp)} className="gap-2 focus:bg-white/5 focus:text-white text-xs">
                                                        <Edit className="h-4 w-4" /> Re-configure
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem 
                                                        onClick={() => setDeleteConfirm(camp)}
                                                        className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 text-xs"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Decommission
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={modalState.open} onOpenChange={(v) => !v && setModalState({ ...modalState, open: false })}>
                <DialogContent className="bg-slate-950 border-white/10 text-white md:max-w-xl">
                    <DialogHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                             <Target className="h-5 w-5 text-neon-blue" />
                            {modalState.mode === 'add' ? 'Deploy Marketing Protocol' : 'Re-configure Campaign'}
                        </CardTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Campaign Name *</Label>
                                <Input {...register('name')} className="bg-white/5 border-white/10" placeholder="e.g. Q1 Solar Awareness" />
                            </div>
                            <div className="space-y-2">
                                <Label>Platform *</Label>
                                <Input {...register('platform')} className="bg-white/5 border-white/10" placeholder="e.g. Google Ads / Meta" />
                            </div>
                            <div className="space-y-2">
                                <Label>Budget (Total)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">₹</span>
                                    <Input type="number" {...register('budget', { valueAsNumber: true })} className="pl-7 bg-white/5 border-white/10 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select onValueChange={(v) => setValue('status', v)} defaultValue={modalState.data?.status || 'Active'}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue placeholder="Protocol Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="Active">Active / Running</SelectItem>
                                        <SelectItem value="Upcoming">Scheduled / Upcoming</SelectItem>
                                        <SelectItem value="Paused">Suspended / Paused</SelectItem>
                                        <SelectItem value="Ended">Terminated / Ended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" {...register('start_date')} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button variant="ghost" type="button" onClick={() => setModalState({ ...modalState, open: false })}>Abort</Button>
                            <Button type="submit" className="bg-neon-blue text-black font-bold">
                                {modalState.mode === 'add' ? 'Initiate Deployment' : 'Apply Configurations'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="bg-slate-950 border-red-500/20 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-500 uppercase">PROTOCOL DECOMMISSIONING</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm italic font-bold">
                            You are about to terminate campaign <span className="text-white">"{deleteConfirm?.name}"</span>.
                            <br/><br/>
                            Historical data for {deleteConfirm?.total_leads} leads will lose its specific campaign link (set to NULL).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Abort</Button>
                        <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                            Execute Termination
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
