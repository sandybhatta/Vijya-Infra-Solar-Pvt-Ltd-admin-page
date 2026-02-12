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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ExpenseEditModal({
  open,
  setOpen,
  expense,
  onSubmit,
  isLoading,
  categories,
  projects
}) {
  const [formData, setFormData] = useState({
    amount: '',
    expense_date: '',
    category_id: '',
    description: '',
    project_id: ''
  })

  useEffect(() => {
    if (open && expense) {
      setFormData({
        amount: expense.amount || '',
        expense_date: expense.expense_date || '',
        category_id: expense.category_id || '',
        description: expense.description || '',
        project_id: expense.project_id || ''
      })
    }
  }, [open, expense])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    if (!formData.expense_date) {
      toast.error('Please select an expense date')
      return
    }

    if (formData.expense_date > format(new Date(), 'yyyy-MM-dd')) {
      toast.error('Expense date cannot be in the future')
      return
    }

    if (!formData.category_id) {
      toast.error('Please select a category')
      return
    }

    if (!formData.description || formData.description.trim().length < 3) {
      toast.error('Description must be at least 3 characters')
      return
    }

    const submitData = {
      id: expense.id,
      ...formData,
      amount: Number(formData.amount),
      project_id: formData.project_id === 'none' || !formData.project_id ? null : formData.project_id
    }

    onSubmit(submitData)
  }

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Edit Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-bold text-gray-400 uppercase">
                Amount (₹) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date" className="text-sm font-bold text-gray-400 uppercase">
                Expense Date *
              </Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-bold text-gray-400 uppercase">
              Category *
            </Label>
            <Select
              value={formData.category_id}
              onValueChange={(val) => setFormData({ ...formData, category_id: val })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-bold text-gray-400 uppercase">
              Project (Optional)
            </Label>
            <Select
              value={formData.project_id}
              onValueChange={(val) => setFormData({ ...formData, project_id: val })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="General expense (no project)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                <SelectItem value="none">General expense (no project)</SelectItem>
                {projects?.map(proj => (
                  <SelectItem key={proj.id} value={proj.id}>{proj.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-gray-400 uppercase">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the expense..."
              rows={3}
              className="bg-white/5 border-white/10 text-white resize-none"
            />
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
                'Update Expense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
