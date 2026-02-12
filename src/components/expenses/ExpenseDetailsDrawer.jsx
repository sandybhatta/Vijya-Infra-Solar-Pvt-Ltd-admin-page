import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Edit, Trash2, Receipt, Folder, Building2, Calendar } from 'lucide-react'
import { ExpenseCategoryBadge, ExpenseTypeBadge } from './ExpenseBadges'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export default function ExpenseDetailsDrawer({ open, setOpen, expense, onEdit, onDelete }) {
  if (!expense) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="bg-gray-900 border-l border-white/10 text-white w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl md:text-2xl font-black text-neon-blue">
            Expense Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Expense Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Receipt className="h-5 w-5" />
              <h3 className="font-bold uppercase text-sm">Expense Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-red-400 font-bold text-lg">{formatCurrency(expense.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Date</span>
                <span className="text-white">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Category</span>
                <ExpenseCategoryBadge category={expense.category_name} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Type</span>
                <ExpenseTypeBadge isProjectExpense={expense.is_project_expense} />
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-gray-400 text-sm block mb-1">Description</span>
                <p className="text-white text-sm">{expense.description}</p>
              </div>
            </div>
          </div>

          {/* Project Info (if applicable) */}
          {expense.is_project_expense && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Building2 className="h-5 w-5" />
                <h3 className="font-bold uppercase text-sm">Project Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Project Name</span>
                  <span className="text-white font-medium">{expense.project_name}</span>
                </div>
                {expense.customer_name && expense.customer_name !== '—' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Customer</span>
                    <span className="text-white">{expense.customer_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setOpen(false)
                onEdit(expense)
              }}
              className="flex-1 bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                onDelete(expense)
              }}
              variant="outline"
              className="flex-1 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
