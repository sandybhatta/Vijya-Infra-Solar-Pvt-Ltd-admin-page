import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription 
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { 
    useAddLeadMutation, 
    useUpdateLeadMutation 
} from '@/features/leads/leadsApi'
import { useGetLeadSourcesQuery } from '@/features/leads/leadSourcesApi'
import { useGetCampaignsQuery } from '@/features/sales/marketingApi'
import toast from 'react-hot-toast'
import { Loader2, Zap, User, Phone, Mail, MapPin } from 'lucide-react'

const leadSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone_number: z.string().min(10, "Phone must be at least 10 digits"),
    city: z.string().min(2, "City is required"),
    state: z.preprocess((val) => val === null || val === '' ? undefined : val, z.string().min(2, "State is required").optional()),
    pincode: z.preprocess((val) => val === null ? '' : val, z.string().optional()),
    solar_type: z.enum(['On-Grid', 'Off-Grid', 'Hybrid']).default('On-Grid'),
    status: z.string().default('new'),
    message: z.preprocess((val) => val === null ? '' : val, z.string().optional()),
    electricity_distribution_company: z.preprocess((val) => val === null ? '' : val, z.string().optional()),
    average_consumption_per_month: z.preprocess((val) => val === null || val === '' ? undefined : val, z.coerce.number().optional()),
    source_id: z.preprocess((val) => val === null || val === '' ? undefined : val, z.string().optional()),
    campaign_id: z.preprocess((val) => val === null || val === '' ? undefined : val, z.string().optional()),
})

export const LeadModal = ({ open, setOpen, initialData = null }) => {
    const [addLead, { isLoading: isAdding }] = useAddLeadMutation()
    const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation()
    
    // We assume these secondary APIs exist for dropdowns
    const { data: sources } = useGetLeadSourcesQuery()
    const { data: campaigns } = useGetCampaignsQuery()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            status: 'new',
            solar_type: 'On-Grid'
        }
    })

    useEffect(() => {
        if (initialData) {
            reset(initialData)
        } else {
            reset({ status: 'new', solar_type: 'On-Grid' })
        }
    }, [initialData, open, reset])

    const onSubmit = async (data) => {
        console.log('Form submitted with data:', data)
        console.log('Initial data:', initialData)
        console.log('Form errors:', errors)
        try {
            if (initialData) {
                console.log('Updating lead with:', { id: initialData.id, ...data })
                const result = await updateLead({ id: initialData.id, ...data }).unwrap()
                console.log('Update result:', result)
                toast.success("Lead Synchronization Complete")
            } else {
                await addLead(data).unwrap()
                toast.success("New Lead Entry Initialized")
            }
            setOpen(false)
        } catch (error) {
            console.error('Update error:', error)
            toast.error(`Data stream interrupted: ${error.message || error}`)
        }
    }

    const onError = (errors) => {
        console.log('Form validation errors:', errors)
        console.log('Error fields:', Object.keys(errors))
        Object.keys(errors).forEach(field => {
            console.log(`Field "${field}":`, errors[field])
        })
        toast.error(`Please fix form errors: ${Object.keys(errors).join(', ')}`)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] bg-stone-950 border border-stone-800 text-white max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-3">
                        <Zap className="h-6 w-6" /> {initialData ? 'Update Core Data' : 'Initialize Lead'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-2 bg-white/5 inline-block px-2 py-0.5 rounded">
                        Secure CRM Input Protocol
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
                    {/* section 1: Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Identification</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Full Name</Label>
                                <Input {...register('name')} className="bg-white/5 border-white/10" placeholder="John Doe" />
                                {errors.name && <p className="text-[10px] text-red-400 font-bold mt-1 italic">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Operational Status</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-stone-900 border-stone-800">
                                                {['new', 'contacted', 'site_visit_done', 'quotation_sent', 'negotiation', 'converted', 'rejected'].map(s => (
                                                    <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Pulse Email</Label>
                                <Input {...register('email')} type="email" className="bg-white/5 border-white/10" placeholder="john@nebula.com" />
                                {errors.email && <p className="text-[10px] text-red-400 font-bold mt-1 italic">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Communication Link</Label>
                                <Input {...register('phone_number')} className="bg-white/5 border-white/10" placeholder="+91 00000 00000" />
                                {errors.phone_number && <p className="text-[10px] text-red-400 font-bold mt-1 italic">{errors.phone_number.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Technical/Location */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Techno-Geographic Data</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">City</Label>
                                <Input {...register('city')} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">State</Label>
                                <Input {...register('state')} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Zip/Pincode</Label>
                                <Input {...register('pincode')} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Solar Infrastructure</Label>
                                <Controller
                                    name="solar_type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Infrastructure Type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-stone-900 border-stone-800">
                                                <SelectItem value="On-Grid">On-Grid System</SelectItem>
                                                <SelectItem value="Off-Grid">Off-Grid System</SelectItem>
                                                <SelectItem value="Hybrid">Hybrid System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Monthly Consumption (kWh)</Label>
                                <Input {...register('average_consumption_per_month')} type="number" className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-black text-muted-foreground">Distribution Company</Label>
                            <Input {...register('electricity_distribution_company')} className="bg-white/5 border-white/10" placeholder="e.g., TSECL, WBSEDCL" />
                        </div>
                    </div>

                    {/* Section 3: Marketing Attribution */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                            <Zap className="h-4 w-4 text-purple-400" />
                            <span className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Attribution Origins</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Original Source</Label>
                                <Controller
                                    name="source_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Traffic Source" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-stone-900 border-stone-800">
                                                {sources?.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Linked Campaign</Label>
                                <Controller
                                    name="campaign_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Specific Campaign" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-stone-900 border-stone-800">
                                                {campaigns?.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isAdding || isUpdating}
                            onClick={(e) => {
                                console.log('Button clicked!')
                                console.log('Is disabled:', isAdding || isUpdating)
                                console.log('Form element:', e.currentTarget.form)
                            }}
                            className="w-full bg-primary text-black font-black uppercase italic tracking-widest py-8 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] text-xs rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdding || isUpdating ? <Loader2 className="animate-spin mr-2 h-4 w-4 inline" /> : (initialData ? 'COMMIT UPDATE' : 'DEPLOY LEAD ENTRY')}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
