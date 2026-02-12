import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useGetPaymentsWithDetailsQuery,
  useGetPaymentAnalyticsQuery,
  useCreatePaymentWithStatusMutation,
  useUpdatePaymentWithStatusMutation,
  useDeletePaymentWithStatusMutation,
  useBulkDeletePaymentsMutation,
} from '@/features/finance/financeApi'
import { useGetProjectsQuery } from '@/features/projects/projectsApi'
import PaymentAnalyticsCards from '@/components/payments/PaymentAnalyticsCards'
import PaymentCharts from '@/components/payments/PaymentCharts'
import PaymentFiltersBar from '@/components/payments/PaymentFiltersBar'
import PaymentTable from '@/components/payments/PaymentTable'
import PaymentCreateModal from '@/components/payments/PaymentCreateModal'
import PaymentEditModal from '@/components/payments/PaymentEditModal'
import PaymentDetailsDrawer from '@/components/payments/PaymentDetailsDrawer'
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

export default function Payments() {
  const [filters, setFilters] = useState({
    search: '',
    paymentMode: '',
    city: '',
    state: '',
    projectId: '',
    invoiceId: '',
    paymentDateFrom: '',
    paymentDateTo: '',
    amountMin: '',
    amountMax: '',
    sortBy: 'newest'
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  })

  const [selectedPayments, setSelectedPayments] = useState([])

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [deletePaymentId, setDeletePaymentId] = useState(null)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [currentPayment, setCurrentPayment] = useState(null)

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
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useGetPaymentsWithDetailsQuery({
    ...sanitizeFilters(filters),
    ...pagination
  })

  const { data: analytics, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useGetPaymentAnalyticsQuery(sanitizeFilters(filters))

  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 1000 })
  const projects = projectsData?.projects || []

  // Mutations
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentWithStatusMutation()
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentWithStatusMutation()
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentWithStatusMutation()
  const [bulkDeletePayments, { isLoading: isBulkDeleting }] = useBulkDeletePaymentsMutation()

  const payments = paymentsData?.payments || []
  const totalPayments = paymentsData?.total || 0

  // Real-time subscriptions
  useEffect(() => {
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        refetchPayments()
        refetchAnalytics()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(paymentsChannel)
    }
  }, [refetchPayments, refetchAnalytics])

  // Handlers
  const handleCreatePayment = async (data) => {
    try {
      await createPayment(data).unwrap()
      toast.success('Payment added successfully! Invoice status updated.')
      setShowCreateModal(false)
      refetchPayments()
      refetchAnalytics()
    } catch (error) {
      toast.error(error?.message || 'Failed to add payment')
    }
  }

  const handleUpdatePayment = async (data) => {
    try {
      await updatePayment(data).unwrap()
      toast.success('Payment updated successfully! Invoice status recalculated.')
      setShowEditModal(false)
      setCurrentPayment(null)
      refetchPayments()
      refetchAnalytics()
    } catch (error) {
      toast.error(error?.message || 'Failed to update payment')
    }
  }

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return

    const payment = payments.find(p => p.id === deletePaymentId)
    if (!payment) return

    try {
      await deletePayment({ id: deletePaymentId, invoice_id: payment.invoice_id }).unwrap()
      toast.success('Payment deleted successfully! Invoice status recalculated.')
      setDeletePaymentId(null)
      refetchPayments()
      refetchAnalytics()
    } catch (error) {
      toast.error(error?.message || 'Failed to delete payment')
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkDeletePayments(selectedPayments).unwrap()
      toast.success(`${selectedPayments.length} payments deleted successfully!`)
      setSelectedPayments([])
      setShowBulkDeleteDialog(false)
      refetchPayments()
      refetchAnalytics()
    } catch (error) {
      toast.error(error?.message || 'Failed to delete payments')
    }
  }

  const handleSelectPayment = (id) => {
    setSelectedPayments(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([])
    } else {
      setSelectedPayments(payments.map(p => p.id))
    }
  }

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.error('No payments to export')
      return
    }

    const csvData = payments.map(p => ({
      'Payment Date': p.payment_date,
      'Amount': p.paid_amount,
      'Payment Mode': p.payment_mode,
      'Transaction Ref': p.transaction_ref || '',
      'Invoice Number': p.invoice_number,
      'Invoice Total': p.invoice_total,
      'Invoice Status': p.invoice_status,
      'Customer Name': p.customer_name,
      'Customer Phone': p.customer_phone,
      'City': p.customer_city,
      'State': p.customer_state,
      'Project': p.project_name,
      'Notes': p.notes || ''
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
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Payments exported to CSV')
  }

  const handleExportSelected = () => {
    if (selectedPayments.length === 0) {
      toast.error('No payments selected')
      return
    }

    const selectedData = payments.filter(p => selectedPayments.includes(p.id))
    const csvData = selectedData.map(p => ({
      'Payment Date': p.payment_date,
      'Amount': p.paid_amount,
      'Payment Mode': p.payment_mode,
      'Transaction Ref': p.transaction_ref || '',
      'Invoice Number': p.invoice_number,
      'Customer Name': p.customer_name,
      'Customer Phone': p.customer_phone,
      'Project': p.project_name
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
    a.download = `selected-payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`${selectedPayments.length} payments exported`)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      paymentMode: '',
      city: '',
      state: '',
      projectId: '',
      invoiceId: '',
      paymentDateFrom: '',
      paymentDateTo: '',
      amountMin: '',
      amountMax: '',
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
              💰 Payments
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Track and manage all payment collections
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => refetchPayments()}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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
              Add Payment
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <PaymentAnalyticsCards analytics={analytics} isLoading={isLoadingAnalytics} />

        {/* Charts */}
        <PaymentCharts analytics={analytics} />

        {/* Filters */}
        <PaymentFiltersBar
          filters={filters}
          setFilters={setFilters}
          projects={projects}
          onReset={handleResetFilters}
        />

        {/* Bulk Actions */}
        {selectedPayments.length > 0 && (
          <div className="bg-neon-blue/20 border border-neon-blue/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-white font-bold">
              {selectedPayments.length} payment{selectedPayments.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportSelected}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button
                onClick={() => setShowBulkDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <PaymentTable
          payments={payments}
          isLoading={isLoadingPayments}
          onEdit={(payment) => {
            setCurrentPayment(payment)
            setShowEditModal(true)
          }}
          onDelete={(payment) => setDeletePaymentId(payment.id)}
          onViewDetails={(payment) => {
            setCurrentPayment(payment)
            setShowDetailsDrawer(true)
          }}
          selectedPayments={selectedPayments}
          onSelectPayment={handleSelectPayment}
          onSelectAll={handleSelectAll}
        />

        {/* Pagination */}
        {totalPayments > pagination.limit && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalPayments)} of {totalPayments} payments
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
                disabled={pagination.page * pagination.limit >= totalPayments}
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
      <PaymentCreateModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        onSubmit={handleCreatePayment}
        isLoading={isCreating}
      />

      <PaymentEditModal
        open={showEditModal}
        setOpen={setShowEditModal}
        payment={currentPayment}
        onSubmit={handleUpdatePayment}
        isLoading={isUpdating}
      />

      <PaymentDetailsDrawer
        open={showDetailsDrawer}
        setOpen={setShowDetailsDrawer}
        payment={currentPayment}
        onEdit={(payment) => {
          setCurrentPayment(payment)
          setShowDetailsDrawer(false)
          setShowEditModal(true)
        }}
        onDelete={(payment) => {
          setDeletePaymentId(payment.id)
          setShowDetailsDrawer(false)
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this payment and recalculate the invoice status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPayments.length} Payments?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete {selectedPayments.length} payment{selectedPayments.length > 1 ? 's' : ''} and recalculate all affected invoice statuses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
