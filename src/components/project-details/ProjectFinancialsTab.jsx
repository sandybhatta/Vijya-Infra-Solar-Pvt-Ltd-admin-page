import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  FileText, 
  CreditCard, 
  Trash2, 
  Calendar,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { 
  useCreateInvoiceMutation, 
  useDeleteInvoiceMutation,
  useCreatePaymentMutation,
  useDeletePaymentMutation 
} from '@/features/finance/financeApi'
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

export default function ProjectFinancialsTab({ project }) {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    
    const [deleteInvoice] = useDeleteInvoiceMutation()
    const [deletePayment] = useDeletePaymentMutation()

    const handleDeleteInvoice = async (id) => {
        if (confirm("Delete this invoice? Related payments may be affected.")) {
            await deleteInvoice(id)
            toast.success("Invoice removed")
        }
    }

    const handleDeletePayment = async (id) => {
        if (confirm("Delete this payment record?")) {
            await deletePayment(id)
            toast.success("Payment removed")
        }
    }

    const totalInvoiced = (project.invoices || []).reduce((s, i) => s + Number(i.invoice_amount || 0), 0)
    const totalPaid = (project.payments || []).reduce((s, p) => s + Number(p.paid_amount || 0), 0)

    return (
        <div className="space-y-6 mt-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-gray-500">Total Billed</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-white">${totalInvoiced.toLocaleString()}</div></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-gray-500">Total Collected</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-neon-green">${totalPaid.toLocaleString()}</div></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-gray-500">Outstanding Balance</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-red-400">${Math.max(0, totalInvoiced - totalPaid).toLocaleString()}</div></CardContent>
                </Card>
            </div>

            {/* Invoices List */}
            <Card className="bg-glass-bg border-glass-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <FileText className="h-5 w-5 text-neon-blue" /> Invoices
                    </CardTitle>
                    <Button onClick={() => setIsInvoiceModalOpen(true)} size="sm" className="bg-neon-blue text-black font-black uppercase text-[10px]">
                        <Plus className="h-3 w-3 mr-1" /> New Invoice
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Number</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Due</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Amount</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Status</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(project.invoices || []).map((inv) => (
                                <TableRow key={inv.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-bold text-white uppercase">{inv.invoice_number}</TableCell>
                                    <TableCell className="text-gray-400 font-mono text-xs">{format(new Date(inv.issue_date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="text-gray-400 font-mono text-xs">{inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '-'}</TableCell>
                                    <TableCell className="font-black text-white">${Number(inv.invoice_amount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-[9px] font-black">{inv.payment_status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(inv.id)} className="h-8 w-8 text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(project.invoices || []).length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-500 font-bold uppercase text-xs">No invoices generated</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payments List */}
            <Card className="bg-glass-bg border-glass-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-neon-green" /> Payment History
                    </CardTitle>
                    <Button onClick={() => setIsPaymentModalOpen(true)} size="sm" className="bg-neon-green text-black font-black uppercase text-[10px]" disabled={(project.invoices || []).length === 0}>
                        <Plus className="h-3 w-3 mr-1" /> Record Payment
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Amount</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Mode</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Reference</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(project.payments || []).map((pay) => (
                                <TableRow key={pay.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="text-gray-400 font-mono text-xs">{format(new Date(pay.payment_date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="font-black text-neon-green">${Number(pay.paid_amount).toLocaleString()}</TableCell>
                                    <TableCell className="capitalize text-gray-300 font-bold">{pay.payment_mode}</TableCell>
                                    <TableCell className="text-gray-500 font-mono text-[10px] uppercase">{pay.reference_number || 'Cash/Direct'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(pay.id)} className="h-8 w-8 text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(project.payments || []).length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-500 font-bold uppercase text-xs">No payments recorded</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modals */}
            <AddInvoiceModal open={isInvoiceModalOpen} setOpen={setIsInvoiceModalOpen} project={project} />
            <AddPaymentModal open={isPaymentModalOpen} setOpen={setIsPaymentModalOpen} project={project} />
        </div>
    )
}

function AddInvoiceModal({ open, setOpen, project }) {
    const [createInvoice, { isLoading }] = useCreateInvoiceMutation()
    const [formData, setFormData] = useState({
        invoice_number: `INV-${Math.floor(Date.now()/1000)}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        invoice_amount: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await createInvoice({
                ...formData,
                project_id: project.id,
                client_id: project.lead_id,
                payment_status: 'sent'
            }).unwrap()
            toast.success("Invoice generated")
            setOpen(false)
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black/95 border-white/10 text-white">
                <DialogHeader><DialogTitle className="uppercase font-black italic text-neon-blue">Initialize Invoice</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Invoice Reference</Label>
                        <Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="bg-white/5 border-white/10" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                             <Label className="uppercase text-[10px] font-black text-gray-500">Issue Date</Label>
                             <Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" required />
                        </div>
                        <div className="grid gap-2">
                             <Label className="uppercase text-[10px] font-black text-gray-500">Due Date</Label>
                             <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                         <Label className="uppercase text-[10px] font-black text-gray-500">Total Amount ($)</Label>
                         <Input type="number" value={formData.invoice_amount} onChange={e => setFormData({...formData, invoice_amount: e.target.value})} className="bg-white/5 border-white/10" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-neon-blue text-black font-black uppercase tracking-widest w-full">Generate</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function AddPaymentModal({ open, setOpen, project }) {
    const [createPayment, { isLoading }] = useCreatePaymentMutation()
    const [formData, setFormData] = useState({
        invoice_id: '',
        paid_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'bank_transfer',
        reference_number: ''
    })

    const invoices = project?.invoices || []

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await createPayment(formData).unwrap()
            toast.success("Payment recorded")
            setOpen(false)
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black/95 border-white/10 text-white">
                <DialogHeader><DialogTitle className="uppercase font-black italic text-neon-green">Record Payment</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Source Invoice</Label>
                        <Select onValueChange={val => setFormData({...formData, invoice_id: val})}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select reference invoice" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10 text-white">
                                {invoices.map(inv => (
                                    <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} (${inv.invoice_amount})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                         <Label className="uppercase text-[10px] font-black text-gray-500">Payment Amount ($)</Label>
                         <Input type="number" value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: e.target.value})} className="bg-white/5 border-white/10" required />
                    </div>
                    <div className="grid gap-2">
                         <Label className="uppercase text-[10px] font-black text-gray-500">Payment Mode</Label>
                         <Select defaultValue="bank_transfer" onValueChange={val => setFormData({...formData, payment_mode: val})}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10 text-white">
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="online">Online Payment</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Payment Date</Label>
                        <Input type="date" value={formData.payment_date} onChange={e => setFormData({...formData, payment_date: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" required />
                    </div>
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Reference / TXN ID</Label>
                        <Input value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-neon-green text-black font-black uppercase tracking-widest w-full">Commit</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
