import React, { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { useGetQuotationsQuery, useCreateQuotationMutation, useUpdateQuotationMutation, useGetBusinessSettingsQuery } from '@/features/finance/quotationsApi'
import { Button } from '@/components/ui/button'
import { Plus, Check, X, FileText, Mail, Trash2, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useSelector } from 'react-redux' // Added
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// --- PDF Generation Utility ---
const generatePDF = (quote, settings) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(0, 243, 255) // Neon Blue-ish
    doc.text(settings?.company_name?.toUpperCase() || "SOLAR PROJECT ADMIN", 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(settings?.company_address || "Headquarters", 14, 28)
    doc.text(`Phone: ${settings?.contact_phone || "N/A"}`, 14, 33)
    
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text("Quotation", 14, 45)
    
    // Details
    doc.setFontSize(10)
    doc.text(`Lead: ${quote.leads?.name || quote.lead_id}`, 14, 55)
    doc.text(`Date: ${format(new Date(quote.created_at), 'PPP')}`, 14, 60)
    doc.text(`Valid Until: ${format(new Date(quote.valid_until), 'PPP')}`, 14, 65)
    
    // Items Table
    const items = quote.items || [] // Assuming JSONB items: [{ description, quantity, rate, amount }]
    // If items is empty/null, use the total amount as a single line item
    const tableData = items.length > 0 ? items.map(i => [i.description, i.quantity, `$${i.rate}`, `$${i.amount}`]) 
                                       : [["Project Estimate", "1", `$${quote.quotation_amount}`, `$${quote.quotation_amount}`]]

    autoTable(doc, {
        startY: 75,
        head: [['Description', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [0, 243, 255] }
    })
    
    // Total
    const finalY = doc.lastAutoTable.finalY || 75
    doc.setFontSize(12)
    doc.text(`Total Amount: $${Number(quote.quotation_amount).toLocaleString()}`, 140, finalY + 10)

    // Footer / Signature
    doc.setFontSize(10)
    doc.text("Authorized Signature", 14, finalY + 40)
    doc.line(14, finalY + 35, 60, finalY + 35)

    doc.save(`Quotation_${quote.leads?.name || 'Client'}_${Date.now()}.pdf`)
}

// --- Create Modal with Line Items ---
const CreateQuotationModal = ({ open, setOpen }) => {
    const [createQuotation, { isLoading }] = useCreateQuotationMutation()
    const [formData, setFormData] = useState({
        lead_id: '',
        valid_until: '',
        items: [{ description: 'Solar Installation System', quantity: 1, rate: 0, amount: 0 }]
    })

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    }

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items]
        newItems[index][field] = value
        
        // Auto-calculate amount if rate/qty changes
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].rate)
        }
        
        setFormData({ ...formData, items: newItems })
    }

    const addItem = () => {
        setFormData({ 
            ...formData, 
            items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }] 
        })
    }

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index)
        setFormData({ ...formData, items: newItems })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
             const totalAmount = calculateTotal()
             await createQuotation({
                 lead_id: formData.lead_id,
                 valid_until: formData.valid_until,
                 items: formData.items,
                 quotation_amount: totalAmount,
                 quotation_status: 'pending'
             }).unwrap()
             toast.success("Quotation created")
             setOpen(false)
        } catch (err) {
            toast.error("Failed to create")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl bg-glass-bg border-glass-border">
                <DialogHeader><DialogTitle className="text-white">New Quotation</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Lead ID (UUID)</Label>
                            <Input value={formData.lead_id} onChange={e => setFormData({...formData, lead_id: e.target.value})} className="bg-white/5 border-white/10 text-white" required placeholder="e.g. 123e4567-..." />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-gray-300">Valid Until</Label>
                             <Input type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} className="bg-white/5 border-white/10 text-white" required />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-gray-300">Line Items</Label>
                        {formData.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Input placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="w-20">
                                     <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="w-24">
                                     <Input type="number" placeholder="Rate" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="w-24">
                                     <div className="h-10 flex items-center px-3 border border-white/10 rounded bg-white/5 text-gray-400">
                                         ${item.amount}
                                     </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-red-400"/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 border-neon-blue text-neon-blue hover:bg-neon-blue/10">Add Item</Button>
                     </div>

                     <div className="flex justify-between items-center pt-4 border-t border-white/10">
                         <div className="text-xl font-bold text-white">Total: ${calculateTotal().toLocaleString()}</div>
                         <Button type="submit" disabled={isLoading} className="bg-neon-blue text-black font-bold">Create Quote</Button>
                     </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function Quotations() {
  const { data: qData, isLoading } = useGetQuotationsQuery({ page: 1, limit: 100 })
  const { data: settings } = useGetBusinessSettingsQuery()
  const quotations = qData?.quotations || []
  const [open, setOpen] = useState(false)
  const [updateQuotation] = useUpdateQuotationMutation()

  const handleStatusChange = async (id, status) => {
      try {
          await updateQuotation({ id, quotation_status: status }).unwrap()
          toast.success(`Marked as ${status}`)
      } catch (e) {
          toast.error("Update failed")
      }
  }

  const handleEmail = (quote) => {
      // Mock email sending
      toast.promise(
          new Promise(resolve => setTimeout(resolve, 1000)),
          {
              loading: 'Sending email...',
              success: 'Quotation sent to lead!',
              error: 'Failed to send'
          }
      )
  }

  const columns = [
    {
        accessorKey: "leads.name",
        header: "Lead",
        cell: ({ row }) => <span className="font-medium text-white">{row.original.leads?.name || row.original.lead_id}</span>
    },
    {
        accessorKey: "quotation_amount",
        header: "Amount",
        cell: ({ row }) => <span className="text-neon-green font-bold"> ${Number(row.getValue("quotation_amount")).toLocaleString()}</span>
    },
    {
        accessorKey: "quotation_status",
        header: "Status",
        cell: ({ row }) => {
            const s = row.getValue("quotation_status")
            let color = 'bg-gray-500'
            if (s === 'accepted') color = 'bg-green-500'
            if (s === 'rejected') color = 'bg-red-500'
            if (s === 'pending') color = 'bg-yellow-500 text-black'
            
            return <Badge className={`${color} capitalize border-none`}>{s}</Badge>
        }
    },
    {
        accessorKey: "valid_until",
        header: "Valid Until",
        cell: ({ row }) => <span className="text-gray-400">{format(new Date(row.getValue("valid_until")), 'MMM dd, yyyy')}</span>
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" title="Download PDF" onClick={() => generatePDF(row.original, settings)}><FileText className="h-4 w-4 text-blue-400"/></Button>
                <Button variant="ghost" size="icon" title="Email Quote" onClick={() => handleEmail(row.original)}><Mail className="h-4 w-4 text-purple-400"/></Button>
                {row.original.quotation_status === 'pending' && (
                    <>
                        <Button variant="ghost" size="icon" title="Accept" onClick={() => handleStatusChange(row.original.id, 'accepted')}><Check className="h-4 w-4 text-green-500"/></Button>
                        <Button variant="ghost" size="icon" title="Reject" onClick={() => handleStatusChange(row.original.id, 'rejected')}><X className="h-4 w-4 text-red-500"/></Button>
                    </>
                )}
            </div>
        )
    }
  ]

  return (
    <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Quotations</h1>
            <Button onClick={() => setOpen(true)} className="bg-neon-blue text-black hover:bg-neon-blue/80 font-bold"><Plus className="mr-2 h-4 w-4"/> New Quote</Button>
        </div>
        
        <div className="bg-glass-bg rounded-xl border border-glass-border overflow-hidden p-1">
            {isLoading ? <div className="p-10 text-center text-neon-blue">Loading Quotes...</div> : <DataTable searchKey="leads.name" columns={columns} data={quotations} pageCount={Math.ceil((qData?.total || 0) / 100)} />}
        </div>
        
        <CreateQuotationModal open={open} setOpen={setOpen} />
    </div>
  )
}
