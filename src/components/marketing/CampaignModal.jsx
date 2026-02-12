import React, { useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Zap, Loader2, Calendar, DollarSign, Globe } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateCampaignMutation, useUpdateCampaignMutation } from '@/features/sales/marketingApi'
import toast from 'react-hot-toast'

const campaignSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name too long"),
    platform: z.string().min(1, "Platform is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional().nullable(),
    budget: z.coerce.number().min(0, "Budget must be >= 0"),
    description: z.string().optional(),
    utm_code: z.string().optional(),
}).refine(data => {
    if (data.end_date && data.start_date) {
        return new Date(data.end_date) >= new Date(data.start_date)
    }
    return true
}, {
    message: "End date cannot be before start date",
    path: ["end_date"]
})

export const CampaignModal = ({ isOpen, onOpenChange, editingCampaign }) => {
    const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation()
    const [updateCampaign, { isLoading: isUpdating }] = useUpdateCampaignMutation()

    const { register, handleSubmit, reset, control, formState: { errors }, watch } = useForm({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            platform: 'facebook',
            budget: 0
        }
    })

    useEffect(() => {
        if (editingCampaign) {
            reset({
                name: editingCampaign.name,
                platform: editingCampaign.platform,
                start_date: editingCampaign.start_date,
                end_date: editingCampaign.end_date,
                budget: editingCampaign.budget,
                description: editingCampaign.description || '',
                utm_code: editingCampaign.utm_code || '',
            })
        } else {
            reset({
                name: '',
                platform: 'facebook',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                budget: 0,
                description: '',
                utm_code: '',
            })
        }
    }, [editingCampaign, reset, isOpen])

    const onSubmit = async (data) => {
        try {
            if (editingCampaign) {
                await updateCampaign({ id: editingCampaign.id, ...data }).unwrap()
                toast.success("Campaign parameters updated")
            } else {
                await createCampaign(data).unwrap()
                toast.success("New marketing protocol established")
            }
            onOpenChange(false)
        } catch (error) {
            toast.error(error?.data?.message || error.message || "Operation failure")
        }
    }

    const startDate = watch('start_date')
    const endDate = watch('end_date')

    const getStatusPreview = () => {
        const today = new Date().toISOString().split('T')[0]
        if (!startDate) return 'IDLE'
        if (startDate > today) return 'UPCOMING'
        if (endDate && endDate < today) return 'COMPLETED'
        return 'RUNNING'
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-stone-950 border-stone-800 text-white sm:max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <DialogHeader>
                    <div className="flex justify-between items-center mb-2">
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                            {editingCampaign ? 'Re-configure Protocol' : 'Deploy New Campaign'}
                        </DialogTitle>
                        <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-black italic">
                            STATUS: {getStatusPreview()}
                        </Badge>
                    </div>
                    <DialogDescription className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold opacity-70">
                        Set targeting parameters and budget allocation for lead acquisition.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">Campaign Signature</Label>
                            <div className="relative">
                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input 
                                    {...register('name')} 
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary text-white italic font-bold"
                                    placeholder="e.g. SOLAR MAX BOOSTER Q1"
                                />
                            </div>
                            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                        </div>

                        {/* Platform */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">Signal Platform</Label>
                            <Controller
                                name="platform"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white italic font-bold">
                                            <SelectValue placeholder="Select Platform" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-stone-900 border-stone-800 text-white">
                                            <SelectItem value="facebook">Facebook Ads</SelectItem>
                                            <SelectItem value="google">Google Ads</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="offline">Offline / Print</SelectItem>
                                            <SelectItem value="referral">Network Referral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">Budget Allocation ($)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input 
                                    type="number"
                                    {...register('budget')} 
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary text-white italic font-bold"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.budget && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.budget.message}</p>}
                        </div>

                        {/* Dates */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">Start Protocol</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input 
                                    type="date"
                                    {...register('start_date')} 
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary text-white italic font-bold"
                                />
                            </div>
                            {errors.start_date && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.start_date.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">End Protocol (Optional)</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input 
                                    type="date"
                                    {...register('end_date')} 
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary text-white italic font-bold"
                                />
                            </div>
                            {errors.end_date && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.end_date.message}</p>}
                        </div>

                        {/* UTM Code */}
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">UTM Signal Code</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input 
                                    {...register('utm_code')} 
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary text-white italic font-bold"
                                    placeholder="e.g. utm_source=fb&utm_campaign=solar_max"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 italic">Strategic Description</Label>
                            <Textarea 
                                {...register('description')} 
                                className="bg-white/5 border-white/10 focus:border-primary text-white italic font-bold min-h-[100px]"
                                placeholder="Internal briefing notes..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-white/5">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="bg-white/5 text-white font-black uppercase italic tracking-widest text-[10px]">Abort</Button>
                        <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary text-black font-black uppercase italic tracking-widest px-10 shadow-[0_0_20px_rgba(0,243,255,0.3)] min-w-[200px]">
                            {isCreating || isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCampaign ? 'EXECUTE UPDATE' : 'DEPLOY SIGNAL')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
