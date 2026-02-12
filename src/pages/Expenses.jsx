import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Trash2, RefreshCw, Folder } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useGetExpensesWithDetailsQuery,
  useGetExpenseAnalyticsQuery,
  useGetProfitLossDataQuery,
  useGetExpenseCategoriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from '@/features/finance/financeApi'
import { useGetProjectsQuery } from '@/features/projects/projectsApi'
import ExpenseAnalyticsCards from '@/components/expenses/ExpenseAnalyticsCards'
import ExpenseCharts from '@/components/expenses/ExpenseCharts'
import ProfitLossSection from '@/components/expenses/ProfitLossSection'
import ExpenseFiltersBar from '@/components/expenses/ExpenseFiltersBar'
import ExpenseTable from '@/components/expenses/ExpenseTable'
import ExpenseCreateModal from '@/components/expenses/ExpenseCreateModal'
import ExpenseEditModal from '@/components/expenses/ExpenseEditModal'
import ExpenseDetailsDrawer from '@/components/expenses/ExpenseDetailsDrawer'
import CategoryManagementModal from '@/components/expenses/CategoryManagementModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabaseClient'

export default function Expenses() {
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    projectId: '',
    expenseDateFrom: '',
    expenseDateTo: '',
    amountMin: '',
    amountMax: '',
    expenseType: '',
    sortBy: 'newest'
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  })

  const [selectedExpenses, setSelectedExpenses] = useState([])

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [deleteExpenseId, setDeleteExpenseId] = useState(null)
  const [currentExpense, setCurrentExpense] = useState(null)

  // Helper to sanitize filters (convert 'all' to empty string)
  const sanitizeFilters = (filters) => {
    const sanitized = { ...filters }
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === 'all') {
        sanitized[key] = ''
      }
    })
    return sanitized
  }

  // API Queries
  const { data: expensesData, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useGetExpensesWithDetailsQuery({
    ...sanitizeFilters(filters),
    ...pagination
  })

  const { data: analytics, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useGetExpenseAnalyticsQuery(sanitizeFilters(filters))

  const { data: profitLossData, isLoading: isLoadingProfitLoss, refetch: refetchProfitLoss } = useGetProfitLossDataQuery({
    dateFrom: filters.expenseDateFrom,
    dateTo: filters.expenseDateTo
  })

  const { data: categories } = useGetExpenseCategoriesQuery()
  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 1000 })
  const projects = projectsData?.projects || []

  // Mutations
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation()
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation()
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()

  const expenses = expensesData?.expenses || []
  const totalExpenses = expensesData?.total || 0

  // Real-time subscriptions
  useEffect(() => {
    const expensesChannel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        refetchExpenses()
        refetchAnalytics()
        refetchProfitLoss()
      })
      .subscribe()

    const categoriesChannel = supabase
      .channel('expense-categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_categories' }, () => {
        refetchExpenses()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(expensesChannel)
      supabase.removeChannel(categoriesChannel)
    }
  }, [refetchExpenses, refetchAnalytics, refetchProfitLoss])

  // Handlers
  const handleCreateExpense = async (data) => {
    try {
      await createExpense(data).unwrap()
      toast.success('Expense added successfully!')
      setShowCreateModal(false)
      refetchExpenses()
      refetchAnalytics()
      refetchProfitLoss()
    } catch (error) {
      toast.error(error?.message || 'Failed to add expense')
    }
  }

  const handleUpdateExpense = async (data) => {
    try {
      await updateExpense(data).unwrap()
      toast.success('Expense updated successfully!')
      setShowEditModal(false)
      setCurrentExpense(null)
      refetchExpenses()
      refetchAnalytics()
      refetchProfitLoss()
    } catch (error) {
      toast.error(error?.message || 'Failed to update expense')
    }
  }

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return

    try {
      await deleteExpense(deleteExpenseId).unwrap()
      toast.success('Expense deleted successfully!')
      setDeleteExpenseId(null)
      refetchExpenses()
      refetchAnalytics()
      refetchProfitLoss()
    } catch (error) {
      toast.error(error?.message || 'Failed to delete expense')
    }
  }

  const handleSelectExpense = (id) => {
    setSelectedExpenses(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([])
    } else {
      setSelectedExpenses(expenses.map(e => e.id))
    }
  }

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export')
      return
    }

    const csvData = expenses.map(e => ({
      'Expense Date': e.expense_date,
      'Amount': e.amount,
      'Category': e.category_name,
      'Description': e.description,
      'Type': e.is_project_expense ? 'Project' : 'General',
      'Project': e.project_name,
      'Customer': e.customer_name
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Expenses exported to CSV')
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      projectId: '',
      expenseDateFrom: '',
      expenseDateTo: '',
      amountMin: '',
      amountMax: '',
      expenseType: '',
      sortBy: 'newest'
    })
    setPagination({ page: 1, limit: 20 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#1a1f2e] to-[#0B0F14] p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              💸 Expenses
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Track and manage all business expenses
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => refetchExpenses()}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCategoryModal(true)}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Folder className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <ExpenseAnalyticsCards analytics={analytics} isLoading={isLoadingAnalytics} />

        {/* Charts */}
        <ExpenseCharts analytics={analytics} />

        {/* Profit & Loss Section */}
        <ProfitLossSection profitLossData={profitLossData} isLoading={isLoadingProfitLoss} />

        {/* Filters */}
        <ExpenseFiltersBar
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          projects={projects}
          onReset={handleResetFilters}
        />

        {/* Bulk Actions */}
        {selectedExpenses.length > 0 && (
          <div className="bg-neon-blue/20 border border-neon-blue/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-white font-bold">
              {selectedExpenses.length} expense{selectedExpenses.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedExpenses([])}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <ExpenseTable
          expenses={expenses}
          isLoading={isLoadingExpenses}
          onEdit={(expense) => {
            setCurrentExpense(expense)
            setShowEditModal(true)
          }}
          onDelete={(expense) => setDeleteExpenseId(expense.id)}
          onViewDetails={(expense) => {
            setCurrentExpense(expense)
            setShowDetailsDrawer(true)
          }}
          selectedExpenses={selectedExpenses}
          onSelectExpense={handleSelectExpense}
          onSelectAll={handleSelectAll}
        />

        {/* Pagination */}
        {totalExpenses > pagination.limit && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalExpenses)} of {totalExpenses} expenses
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= totalExpenses}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <ExpenseCreateModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        onSubmit={handleCreateExpense}
        isLoading={isCreating}
        categories={categories}
        projects={projects}
      />

      <ExpenseEditModal
        open={showEditModal}
        setOpen={setShowEditModal}
        expense={currentExpense}
        onSubmit={handleUpdateExpense}
        isLoading={isUpdating}
        categories={categories}
        projects={projects}
      />

      <ExpenseDetailsDrawer
        open={showDetailsDrawer}
        setOpen={setShowDetailsDrawer}
        expense={currentExpense}
        onEdit={(expense) => {
          setCurrentExpense(expense)
          setShowDetailsDrawer(false)
          setShowEditModal(true)
        }}
        onDelete={(expense) => {
          setDeleteExpenseId(expense.id)
          setShowDetailsDrawer(false)
        }}
      />

      <CategoryManagementModal
        open={showCategoryModal}
        setOpen={setShowCategoryModal}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this expense. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
