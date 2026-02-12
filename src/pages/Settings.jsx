import React, { useState, useEffect } from 'react'
import { useGetBusinessSettingsQuery, useUpdateBusinessSettingsMutation } from '@/features/finance/financeApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { Loader2, Save } from 'lucide-react'

export default function Settings() {
    const { data: settings, isLoading } = useGetBusinessSettingsQuery()
    const [updateSettings, { isLoading: isUpdating }] = useUpdateBusinessSettingsMutation()
    
    const [formData, setFormData] = useState({
        company_name: '',
        company_address: '',
        company_email: '',
        company_phone: '',
        tax_rate: 0,
        currency: 'USD'
    })

    useEffect(() => {
        if (settings) {
            setFormData({
                company_name: settings.company_name || '',
                company_address: settings.company_address || '',
                company_email: settings.company_email || '',
                company_phone: settings.company_phone || '',
                tax_rate: settings.tax_rate || 0,
                currency: settings.currency || 'USD'
            })
        }
    }, [settings])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await updateSettings(formData).unwrap()
            toast.success("Settings saved")
        } catch (error) {
            toast.error("Failed to save settings")
        }
    }

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-neon-blue"/></div>

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Settings</h1>
                 <p className="text-gray-400">Manage global business configurations.</p>
            </div>

            <Card className="bg-glass-bg border-glass-border">
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>This information will appear on generated PDFs (Invoices, Quotations).</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                             <Label>Company Name</Label>
                             <Input value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="grid gap-2">
                             <Label>Address</Label>
                             <Input value={formData.company_address} onChange={e => setFormData({...formData, company_address: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input value={formData.company_email} onChange={e => setFormData({...formData, company_email: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                             </div>
                             <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input value={formData.company_phone} onChange={e => setFormData({...formData, company_phone: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                             <div className="grid gap-2">
                                <Label>Default Tax Rate (%)</Label>
                                <Input type="number" step="0.1" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value)})} className="bg-white/5 border-white/10 text-white" />
                             </div>
                             <div className="grid gap-2">
                                <Label>Currency</Label>
                                <Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                             </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isUpdating} className="bg-neon-blue text-black font-bold">
                                {isUpdating && <Loader2 className="animate-spin mr-2 h-4 w-4"/>}
                                <Save className="mr-2 h-4 w-4"/> Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
