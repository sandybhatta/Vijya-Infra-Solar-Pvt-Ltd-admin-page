import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Plus, MoreVertical, Download, Trash2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'

// API Hooks
import {
  useGetInvoicesWithDetailsQuery,
  useGetInvoiceAnalyticsQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useBulkDeleteInvoicesMutation,
  useBulkUpdateInvoiceStatusMutation,
  useGetPaymentsForInvoiceQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetBusinessSettingsQuery,
} from '@/features/finance/financeApi'

import { useGetProjectsQuery } from '@/features/projects/projectsApi'

// Components
import InvoiceAnalyticsCards from '@/components/invoices/InvoiceAnalyticsCards'
import InvoiceFiltersBar from '@/components/invoices/InvoiceFiltersBar'
import InvoiceTable from '@/components/invoices/InvoiceTable'
import InvoiceCreateModal from '@/components/invoices/InvoiceCreateModal'
import InvoiceEditModal from '@/components/invoices/InvoiceEditModal'
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal'
import PaymentDrawer from '@/components/invoices/PaymentDrawer'

export default function Invoices() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    projectId: '',
    city: '',
    state: '',
    invoiceDateFrom: '',
    invoiceDateTo: '',
    dueDateFrom: '',
    dueDateTo: '',
    sortBy: 'newest'
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  })

  const [selectedInvoices, setSelectedInvoices] = useState([])
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false)
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  
  const [currentInvoice, setCurrentInvoice] = useState(null)

  // ============================================================================
  // API QUERIES & MUTATIONS
  // ============================================================================

  const { data: invoicesData, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useGetInvoicesWithDetailsQuery({
    ...pagination,
    ...filters
  })

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useGetInvoiceAnalyticsQuery(filters)

  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 1000 })
  const projects = projectsData?.projects || []

  const { data: businessSettings } = useGetBusinessSettingsQuery()

  const { data: paymentsData, isLoading: isLoadingPayments } = useGetPaymentsForInvoiceQuery(
    currentInvoice?.id,
    { skip: !currentInvoice?.id }
  )

  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation()
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation()
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation()
  const [bulkDeleteInvoices, { isLoading: isBulkDeleting }] = useBulkDeleteInvoicesMutation()
  const [bulkUpdateStatus, { isLoading: isBulkUpdating }] = useBulkUpdateInvoiceStatusMutation()
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation()
  const [deletePayment, { isLoading: isDeletingPayment }] = useDeletePaymentMutation()

  const invoices = invoicesData?.invoices || []
  const totalInvoices = invoicesData?.total || 0

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  useEffect(() => {
    const invoiceChannel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        refetchInvoices()
      })
      .subscribe()

    const paymentChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        refetchInvoices()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(invoiceChannel)
      supabase.removeChannel(paymentChannel)
    }
  }, [refetchInvoices])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCreateInvoice = async (data) => {
    try {
      await createInvoice(data).unwrap()
      toast.success('Invoice created successfully!')
      setShowCreateModal(false)
      refetchInvoices()
    } catch (error) {
      toast.error(error || 'Failed to create invoice')
    }
  }

  const handleUpdateInvoice = async (data) => {
    try {
      await updateInvoice(data).unwrap()
      toast.success('Invoice updated successfully!')
      setShowEditModal(false)
      setCurrentInvoice(null)
      refetchInvoices()
    } catch (error) {
      toast.error(error || 'Failed to update invoice')
    }
  }

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return
    
    try {
      await deleteInvoice(deleteInvoiceId).unwrap()
      toast.success('Invoice deleted successfully!')
      setDeleteInvoiceId(null)
      refetchInvoices()
    } catch (error) {
      toast.error(error || 'Failed to delete invoice')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return

    try {
      await bulkDeleteInvoices(selectedInvoices).unwrap()
      toast.success(`${selectedInvoices.length} invoice(s) deleted successfully!`)
      setSelectedInvoices([])
      setShowBulkDeleteDialog(false)
      refetchInvoices()
    } catch (error) {
      toast.error(error || 'Failed to delete invoices')
    }
  }

  const handleBulkUpdateStatus = async (status) => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices first')
      return
    }

    try {
      await bulkUpdateStatus({ ids: selectedInvoices, payment_status: status }).unwrap()
      toast.success(`${selectedInvoices.length} invoice(s) updated to ${status}!`)
      setSelectedInvoices([])
      refetchInvoices()
    } catch (error) {
      toast.error(error || 'Failed to update invoices')
    }
  }

  const handleAddPayment = async (data, onSuccess) => {
    try {
      await createPayment(data).unwrap()
      toast.success('Payment added successfully!')
      refetchInvoices()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error(error || 'Failed to add payment')
    }
  }

  const handleDeletePayment = async (data, onSuccess) => {
    try {
      await deletePayment(data).unwrap()
      toast.success('Payment deleted successfully!')
      refetchInvoices()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error(error || 'Failed to delete payment')
    }
  }

  const handleExportCSV = () => {
    const dataToExport = selectedInvoices.length > 0
      ? invoices.filter(inv => selectedInvoices.includes(inv.id))
      : invoices

    if (dataToExport.length === 0) {
      toast.error('No invoices to export')
      return
    }

    const headers = [
      'Invoice Number',
      'Customer',
      'Phone',
      'Project',
      'Invoice Amount',
      'GST Amount',
      'Total Amount',
      'Paid Amount',
      'Pending Amount',
      'Payment Status',
      'Invoice Date',
      'Due Date'
    ]

    const rows = dataToExport.map(inv => [
      inv.invoice_number,
      inv.customer_name,
      inv.customer_phone,
      inv.projects?.project_name || '',
      inv.invoice_amount,
      inv.gst_amount,
      inv.total_amount,
      inv.paid_amount,
      inv.pending_amount,
      inv.payment_status,
      inv.invoice_date,
      inv.due_date
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${dataToExport.length} invoice(s)!`)
  }

  const handleSelectInvoice = (id) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(invoices.map(inv => inv.id))
    }
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      projectId: '',
      city: '',
      state: '',
      invoiceDateFrom: '',
      invoiceDateTo: '',
      dueDateFrom: '',
      dueDateTo: '',
      sortBy: 'newest'
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Invoices</h1>
            <p className="text-sm md:text-base text-gray-400 mt-1">
              Manage invoices and track payments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedInvoices.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10">
                      <MoreVertical className="h-4 w-4 mr-2" />
                      Bulk Actions ({selectedInvoices.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border-white/10 text-white">
                    <DropdownMenuItem onClick={() => handleBulkUpdateStatus('paid')} className="cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                      Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdateStatus('pending')} className="cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-orange-400" />
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdateStatus('partial')} className="cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-400" />
                      Mark as Partial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowBulkDeleteDialog(true)} 
                      className="cursor-pointer text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button
              onClick={handleExportCSV}
              className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <InvoiceAnalyticsCards 
          analytics={analyticsData} 
          isLoading={isLoadingAnalytics} 
        />

        {/* Filters */}
        <InvoiceFiltersBar
          filters={filters}
          setFilters={setFilters}
          projects={projects}
          onReset={handleResetFilters}
        />

        {/* Invoice Table */}
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoadingInvoices}
          onEdit={(invoice) => {
            setCurrentInvoice(invoice)
            setShowEditModal(true)
          }}
          onDelete={(invoice) => setDeleteInvoiceId(invoice.id)}
          onViewPayments={(invoice) => {
            setCurrentInvoice(invoice)
            setShowPaymentDrawer(true)
          }}
          onPreview={(invoice) => {
            setCurrentInvoice(invoice)
            setShowPreviewModal(true)
          }}
          selectedInvoices={selectedInvoices}
          onSelectInvoice={handleSelectInvoice}
          onSelectAll={handleSelectAll}
        />

        {/* Pagination */}
        {totalInvoices > pagination.limit && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, totalInvoices)} of {totalInvoices} invoices
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= totalInvoices}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <InvoiceCreateModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        onSubmit={handleCreateInvoice}
        isLoading={isCreating}
        projects={projects}
      />

      <InvoiceEditModal
        open={showEditModal}
        setOpen={setShowEditModal}
        invoice={currentInvoice}
        onSubmit={handleUpdateInvoice}
        isLoading={isUpdating}
        projects={projects}
      />

      <InvoicePreviewModal
        open={showPreviewModal}
        setOpen={setShowPreviewModal}
        invoice={currentInvoice}
        businessSettings={businessSettings}
      />

      <PaymentDrawer
        open={showPaymentDrawer}
        setOpen={setShowPaymentDrawer}
        invoice={currentInvoice}
        payments={paymentsData || []}
        isLoadingPayments={isLoadingPayments}
        onAddPayment={handleAddPayment}
        onDeletePayment={handleDeletePayment}
        isSubmitting={isCreatingPayment || isDeletingPayment}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the invoice and all associated payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedInvoices.length} Invoice(s)?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the selected invoices and all associated payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
