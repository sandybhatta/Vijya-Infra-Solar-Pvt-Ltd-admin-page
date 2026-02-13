import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Building2, Mail, Phone, MapPin, Hash, Clock } from 'lucide-react'
import { useBusinessSettings, useBusinessSettingsMutation } from '@/hooks/useSettings'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const businessSchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    gst_number: z.string().optional(),
    address: z.string().optional(),
    contact_email: z.string().email("Invalid email address").or(z.literal('')),
    contact_phone: z.string().min(10, "Invalid phone number").or(z.literal('')),
})

export function BusinessProfileTab() {
    const { data: settings, isLoading } = useBusinessSettings()
    const mutation = useBusinessSettingsMutation()

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            company_name: '',
            gst_number: '',
            address: '',
            contact_email: '',
            contact_phone: '',
        }
    })

    useEffect(() => {
        if (settings) {
            reset({
                company_name: settings.company_name || '',
                gst_number: settings.gst_number || '',
                address: settings.address || '',
                contact_email: settings.contact_email || '',
                contact_phone: settings.contact_phone || '',
            })
        }
    }, [settings, reset])

    const onSubmit = async (data) => {
        try {
            await mutation.mutateAsync(data)
            toast.success("Business profile updated")
        } catch (error) {
            toast.error("Failed to update profile")
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neon-blue" /></div>

    return (
        <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                            <Building2 className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-white">Business Profile</CardTitle>
                            <CardDescription>Configure your company details and official information.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Company Name *</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input 
                                        {...register('company_name')}
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-neon-blue" 
                                        placeholder="Solar Energy Solutions"
                                    />
                                </div>
                                {errors.company_name && <p className="text-xs text-red-400">{errors.company_name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-400">GST Number</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input 
                                        {...register('gst_number')}
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-neon-blue" 
                                        placeholder="27AAAAA0000A1Z5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-400">Contact Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input 
                                        {...register('contact_email')}
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-neon-blue" 
                                        placeholder="contact@company.com"
                                    />
                                </div>
                                {errors.contact_email && <p className="text-xs text-red-400">{errors.contact_email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-400">Contact Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input 
                                        {...register('contact_phone')}
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-neon-blue" 
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                {errors.contact_phone && <p className="text-xs text-red-400">{errors.contact_phone.message}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-gray-400">Official Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <textarea 
                                        {...register('address')}
                                        className="w-full min-h-[100px] pl-10 pt-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue" 
                                        placeholder="Floor 4, Solar Tower, Tech Park, City"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>Profile created on: {settings?.created_at ? format(new Date(settings.created_at), 'PPP p') : 'Never'}</span>
                            </div>
                            <Button 
                                type="submit" 
                                disabled={mutation.isPending || !isDirty}
                                className="bg-neon-blue text-black hover:bg-neon-blue/80 font-bold px-8"
                            >
                                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Update Profile
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
