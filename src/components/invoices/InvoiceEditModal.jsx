import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvoiceEditModal({ 
  open, 
  setOpen, 
  invoice,
  onSubmit, 
  isLoading,
  projects = []
}) {
  const [formData, setFormData] = useState({
    project_id: '',
    invoice_amount: '',
    gst_amount: '',
    invoice_date: '',
    due_date: '',
    payment_status: 'pending'
  })

  useEffect(() => {
    if (open && invoice) {
      // Pre-fill form with invoice data
      setFormData({
        project_id: invoice.project_id || '',
        invoice_amount: invoice.invoice_amount || '',
        gst_amount: invoice.gst_amount || '',
        invoice_date: invoice.invoice_date || '',
        due_date: invoice.due_date || '',
        payment_status: invoice.payment_status || 'pending'
      })
    }
  }, [open, invoice])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.project_id) {
      toast.error('Please select a project')
      return
    }

    if (!formData.invoice_amount || Number(formData.invoice_amount) <= 0) {
      toast.error('Invoice amount must be greater than 0')
      return
    }

    if (Number(formData.gst_amount) < 0) {
      toast.error('GST amount cannot be negative')
      return
    }

    if (!formData.invoice_date) {
      toast.error('Please select an invoice date')
      return
    }

    if (!formData.due_date) {
      toast.error('Please select a due date')
      return
    }

    if (formData.due_date < formData.invoice_date) {
      toast.error('Due date cannot be before invoice date')
      return
    }

    // Prepare data for submission
    const submitData = {
      id: invoice.id,
      ...formData,
      invoice_amount: Number(formData.invoice_amount),
      gst_amount: Number(formData.gst_amount)
    }

    onSubmit(submitData)
  }

  const totalAmount = Number(formData.invoice_amount || 0) + Number(formData.gst_amount || 0)
  const selectedProject = projects.find(p => p.id === formData.project_id)

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Edit Invoice
          </DialogTitle>
          <div className="text-sm text-gray-400 font-mono">
            {invoice.invoice_number}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-bold text-gray-400 uppercase">
              Project *
            </Label>
            <Select value={formData.project_id} onValueChange={(val) => setFormData({ ...formData, project_id: val })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name} {project.leads?.name && `(${project.leads.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject?.leads && (
              <div className="text-xs text-gray-500">
                Customer: {selectedProject.leads.name} • {selectedProject.leads.phone_number}
              </div>
            )}
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_amount" className="text-sm font-bold text-gray-400 uppercase">
                Invoice Amount (₹) *
              </Label>
              <Input
                id="invoice_amount"
                type="number"
                step="0.01"
                value={formData.invoice_amount}
                onChange={(e) => setFormData({ ...formData, invoice_amount: e.target.value })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_amount" className="text-sm font-bold text-gray-400 uppercase">
                GST Amount (₹) *
              </Label>
              <Input
                id="gst_amount"
                type="number"
                step="0.01"
                value={formData.gst_amount}
                onChange={(e) => setFormData({ ...formData, gst_amount: e.target.value })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Total Amount Display */}
          {totalAmount > 0 && (
            <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400 uppercase">Total Amount</span>
                <span className="text-2xl font-black text-neon-blue">
                  ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date" className="text-sm font-bold text-gray-400 uppercase">
                Invoice Date *
              </Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-bold text-gray-400 uppercase">
                Due Date *
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                min={formData.invoice_date}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="payment_status" className="text-sm font-bold text-gray-400 uppercase">
              Payment Status
            </Label>
            <Select 
              value={formData.payment_status} 
              onValueChange={(val) => setFormData({ ...formData, payment_status: val })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Note: Payment status is auto-calculated based on payments. Manual changes may be overridden.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Invoice'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
