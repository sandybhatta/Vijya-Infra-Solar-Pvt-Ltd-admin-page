import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'
import { format } from 'date-fns'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Recalculate and update invoice payment status based on payments
 */
async function recalculateInvoiceStatus(invoiceId) {
  try {
    // 1. Get invoice details
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_amount, gst_amount')
      .eq('id', invoiceId)
      .single()

    if (!invoice) return

    // 2. Calculate total invoice amount
    const invoiceTotal = Number(invoice.invoice_amount || 0) + Number(invoice.gst_amount || 0)

    // 3. Get all payments for this invoice
    const { data: payments } = await supabase
      .from('payments')
      .select('paid_amount')
      .eq('invoice_id', invoiceId)

    // 4. Calculate total paid
    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0

    // 5. Determine status
    let status = 'pending'
    if (totalPaid === 0) {
      status = 'pending'
    } else if (totalPaid < invoiceTotal) {
      status = 'partial'
    } else if (totalPaid >= invoiceTotal) {
      status = 'paid'
    }

    // 6. Update invoice status
    await supabase
      .from('invoices')
      .update({ payment_status: status })
      .eq('id', invoiceId)

  } catch (error) {
    console.error('Error recalculating invoice status:', error)
  }
}


export const financeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================================
    // ENHANCED INVOICES ENDPOINTS
    // ============================================================================
    
    /**
     * Get invoices with full details (projects, leads, payments aggregation)
     * Supports advanced filtering, search, sorting, and pagination
     */
    getInvoicesWithDetails: builder.query({
      queryFn: async ({ 
        page = 1, 
        limit = 20, 
        search = '',
        status = '',
        projectId = '',
        city = '',
        state = '',
        invoiceDateFrom = '',
        invoiceDateTo = '',
        dueDateFrom = '',
        dueDateTo = '',
        sortBy = 'newest' // newest, oldest, highest, lowest, overdue
      }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1

          // Base query with deep joins
          let query = supabase
            .from('invoices')
            .select(`
              *,
              projects (
                id,
                project_name,
                project_status,
                leads (
                  id,
                  name,
                  email,
                  phone_number,
                  city,
                  state
                )
              )
            `, { count: 'exact' })

          // Apply filters
          if (status && status !== 'all') {
            query = query.eq('payment_status', status)
          }

          if (projectId) {
            query = query.eq('project_id', projectId)
          }

          // Search filter (invoice_number, customer name, phone)
          if (search) {
            // Note: Supabase doesn't support OR across joined tables easily
            // We'll search invoice_number first, then filter in JS if needed
            query = query.or(`invoice_number.ilike.%${search}%`)
          }

          // Date range filters
          if (invoiceDateFrom) {
            query = query.gte('invoice_date', invoiceDateFrom)
          }
          if (invoiceDateTo) {
            query = query.lte('invoice_date', invoiceDateTo)
          }
          if (dueDateFrom) {
            query = query.gte('due_date', dueDateFrom)
          }
          if (dueDateTo) {
            query = query.lte('due_date', dueDateTo)
          }

          // Apply sorting
          switch (sortBy) {
            case 'oldest':
              query = query.order('invoice_date', { ascending: true })
              break
            case 'highest':
              query = query.order('invoice_amount', { ascending: false })
              break
            case 'lowest':
              query = query.order('invoice_amount', { ascending: true })
              break
            case 'overdue':
              query = query.order('due_date', { ascending: true })
              break
            case 'newest':
            default:
              query = query.order('invoice_date', { ascending: false })
          }

          query = query.range(from, to)

          const { data: invoices, error, count } = await query

          if (error) throw error

          // If no invoices, return early to avoid undefined invoice_id errors
          if (!invoices || invoices.length === 0) {
            return {
              data: {
                invoices: [],
                total: count || 0
              }
            }
          }

          // Fetch payments for each invoice to calculate paid_amount
          const invoicesWithPayments = await Promise.all(
            invoices.map(async (invoice) => {
              const { data: payments } = await supabase
                .from('payments')
                .select('paid_amount')
                .eq('invoice_id', invoice.id)

              const paid_amount = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0
              const total_amount = Number(invoice.invoice_amount || 0) + Number(invoice.gst_amount || 0)
              const pending_amount = total_amount - paid_amount
              const is_overdue = invoice.due_date < format(new Date(), 'yyyy-MM-dd') && invoice.payment_status !== 'paid'

              return {
                ...invoice,
                total_amount,
                paid_amount,
                pending_amount,
                is_overdue,
                customer_name: invoice.projects?.leads?.name || 'N/A',
                customer_phone: invoice.projects?.leads?.phone_number || '',
                customer_city: invoice.projects?.leads?.city || '',
                customer_state: invoice.projects?.leads?.state || ''
              }
            })
          )

          // Apply client-side filters for city/state/search (if needed)
          let filteredInvoices = invoicesWithPayments

          if (city) {
            filteredInvoices = filteredInvoices.filter(inv => 
              inv.customer_city?.toLowerCase().includes(city.toLowerCase())
            )
          }

          if (state) {
            filteredInvoices = filteredInvoices.filter(inv => 
              inv.customer_state?.toLowerCase().includes(state.toLowerCase())
            )
          }

          if (search) {
            filteredInvoices = filteredInvoices.filter(inv =>
              inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
              inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
              inv.customer_phone?.includes(search)
            )
          }

          return { 
            data: { 
              invoices: filteredInvoices, 
              total: count 
            } 
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Invoices'],
    }),

    /**
     * Get invoice analytics/KPIs
     * Supports same filters as main query for dynamic updates
     */
    getInvoiceAnalytics: builder.query({
      queryFn: async ({ 
        status = '',
        projectId = '',
        invoiceDateFrom = '',
        invoiceDateTo = ''
      } = {}) => {
        try {
          // Build query with filters
          let query = supabase.from('invoices').select('*')

          if (status && status !== 'all') {
            query = query.eq('payment_status', status)
          }
          if (projectId) {
            query = query.eq('project_id', projectId)
          }
          if (invoiceDateFrom) {
            query = query.gte('invoice_date', invoiceDateFrom)
          }
          if (invoiceDateTo) {
            query = query.lte('invoice_date', invoiceDateTo)
          }

          const { data: invoices, error } = await query

          if (error) throw error

          // Calculate analytics
          const total_invoices = invoices?.length || 0
          const total_revenue = invoices?.reduce((sum, inv) => 
            sum + Number(inv.invoice_amount || 0) + Number(inv.gst_amount || 0), 0
          ) || 0

          // Fetch all payments for these invoices
          const invoiceIds = invoices?.map(inv => inv.id) || []
          let total_collected = 0

          if (invoiceIds.length > 0) {
            const { data: payments } = await supabase
              .from('payments')
              .select('paid_amount')
              .in('invoice_id', invoiceIds)

            total_collected = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0
          }

          const total_pending = total_revenue - total_collected
          const pending_count = invoices?.filter(inv => inv.payment_status === 'pending').length || 0
          const partial_count = invoices?.filter(inv => inv.payment_status === 'partial').length || 0
          const paid_count = invoices?.filter(inv => inv.payment_status === 'paid').length || 0
          
          const today = format(new Date(), 'yyyy-MM-dd')
          const overdue_count = invoices?.filter(inv => 
            inv.due_date < today && inv.payment_status !== 'paid'
          ).length || 0

          return {
            data: {
              kpis: {
                total_invoices,
                total_revenue,
                total_collected,
                total_pending,
                pending_count,
                partial_count,
                paid_count,
                overdue_count
              }
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['InvoiceAnalytics'],
    }),

    /**
     * Create new invoice with validation
     */
    createInvoice: builder.mutation({
      queryFn: async (invoiceData) => {
        try {
          // Validate invoice_number uniqueness
          if (invoiceData.invoice_number) {
            const { data: existing } = await supabase
              .from('invoices')
              .select('id')
              .eq('invoice_number', invoiceData.invoice_number)
              .maybeSingle()

            if (existing) {
              throw new Error('Invoice number already exists')
            }
          } else {
            // Auto-generate invoice number
            const year = new Date().getFullYear()
            const { data: lastInvoice } = await supabase
              .from('invoices')
              .select('invoice_number')
              .ilike('invoice_number', `INV-${year}-%`)
              .order('invoice_number', { ascending: false })
              .limit(1)
              .maybeSingle()

            let sequence = 1
            if (lastInvoice?.invoice_number) {
              const match = lastInvoice.invoice_number.match(/INV-\d{4}-(\d+)/)
              if (match) {
                sequence = parseInt(match[1]) + 1
              }
            }

            invoiceData.invoice_number = `INV-${year}-${String(sequence).padStart(4, '0')}`
          }

          // Validate amounts
          if (Number(invoiceData.invoice_amount) <= 0) {
            throw new Error('Invoice amount must be greater than 0')
          }
          if (Number(invoiceData.gst_amount) < 0) {
            throw new Error('GST amount cannot be negative')
          }

          // Validate dates
          if (invoiceData.due_date < invoiceData.invoice_date) {
            throw new Error('Due date cannot be before invoice date')
          }

          // Set default payment_status
          if (!invoiceData.payment_status) {
            invoiceData.payment_status = 'pending'
          }

          // Create invoice
          const { data: newInvoice, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select()
            .single()

          if (error) throw error

          return { data: newInvoice }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Invoices', 'InvoiceAnalytics', 'Projects'],
    }),

    /**
     * Update existing invoice
     */
    updateInvoice: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          // Validate if provided
          if (updates.invoice_amount !== undefined && Number(updates.invoice_amount) <= 0) {
            throw new Error('Invoice amount must be greater than 0')
          }
          if (updates.gst_amount !== undefined && Number(updates.gst_amount) < 0) {
            throw new Error('GST amount cannot be negative')
          }
          if (updates.due_date && updates.invoice_date && updates.due_date < updates.invoice_date) {
            throw new Error('Due date cannot be before invoice date')
          }

          const { data, error } = await supabase
            .from('invoices')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

          if (error) throw error

          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Invoices', 'InvoiceAnalytics', 'Projects'],
    }),

    /**
     * Delete invoice (cascades to payments via DB)
     */
    deleteInvoice: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase.from('invoices').delete().eq('id', id)
          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Invoices', 'InvoiceAnalytics', 'Projects'],
    }),

    /**
     * Bulk delete invoices
     */
    bulkDeleteInvoices: builder.mutation({
      queryFn: async (ids) => {
        try {
          const { error } = await supabase.from('invoices').delete().in('id', ids)
          if (error) throw error
          return { data: ids }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Invoices', 'InvoiceAnalytics', 'Projects'],
    }),

    /**
     * Bulk update invoice status
     */
    bulkUpdateInvoiceStatus: builder.mutation({
      queryFn: async ({ ids, payment_status }) => {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .update({ payment_status })
            .in('id', ids)
            .select()

          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Invoices', 'InvoiceAnalytics', 'Projects'],
    }),

    // ============================================================================
    // PAYMENTS ENDPOINTS
    // ============================================================================

    /**
     * Get payments for a specific invoice
     */
    getPaymentsForInvoice: builder.query({
      queryFn: async (invoiceId) => {
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('payment_date', { ascending: false })

          if (error) throw error
          return { data: data || [] }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: (result, error, invoiceId) => [{ type: 'Payments', id: invoiceId }],
    }),

    /**
     * Create payment and auto-update invoice status
     * Note: The DB trigger will handle status update automatically
     */
    createPayment: builder.mutation({
      queryFn: async (payment) => {
        try {
          const { data, error } = await supabase
            .from('payments')
            .insert([payment])
            .select()
            .single()

          if (error) throw error

          // The trigger will auto-update the invoice payment_status
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: (result, error, payment) => [
        'Payments',
        { type: 'Payments', id: payment.invoice_id },
        'Invoices',
        'InvoiceAnalytics',
        'Projects'
      ],
    }),

    /**
     * Delete payment and auto-update invoice status
     */
    deletePayment: builder.mutation({
      queryFn: async ({ id, invoice_id }) => {
        try {
          const { error } = await supabase.from('payments').delete().eq('id', id)
          if (error) throw error

          // The trigger will auto-update the invoice payment_status
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: (result, error, { invoice_id }) => [
        'Payments',
        { type: 'Payments', id: invoice_id },
        'Invoices',
        'InvoiceAnalytics',
        'Projects'
      ],
    }),

    // ============================================================================
    // LEGACY ENDPOINTS (Kept for backward compatibility)
    // ============================================================================

    getInvoices: builder.query({
      queryFn: async ({ page = 1, limit = 10, status = '' }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          let query = supabase
            .from('invoices')
            .select('*, leads:client_id(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

          if (status && status !== 'all') {
            query = query.eq('payment_status', status)
          }

          const { data, error, count } = await query
          if (error) throw error
          
          return { data: { invoices: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Invoices'],
    }),

    getInvoiceDetails: builder.query({
      queryFn: async (id) => {
        try {
          const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*, projects(*), leads(*), invoice_items(*)')
            .eq('id', id)
            .single()
          if (error) throw error
          return { data: invoice }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: (result, error, id) => [{ type: 'Invoices', id }]
    }),

    updateInvoiceStatus: builder.mutation({
      queryFn: async ({ id, status }) => {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .update({ payment_status: status })
            .eq('id', id)
            .select()
            .single()
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Invoices', 'Projects']
    }),

    // ============================================================================
    // EXPENSES ENDPOINTS
    // ============================================================================

    getExpenses: builder.query({
      queryFn: async ({ page = 1, limit = 10, category = '' }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          let query = supabase
            .from('expenses')
            .select('*', { count: 'exact' })
            .order('expense_date', { ascending: false })
            .range(from, to)
          
          if (category && category !== 'all') {
            query = query.eq('category', category)
          }

          const { data, error, count } = await query
          if (error) throw error
          return { data: { expenses: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Expenses']
    }),

    addExpense: builder.mutation({
      queryFn: async (expense) => {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single()
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Expenses', 'Projects']
    }),

    // ============================================================================
    // BUSINESS SETTINGS ENDPOINTS
    // ============================================================================

    getBusinessSettings: builder.query({
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('business_settings')
            .select('id, company_name, gst_number, address, contact_email, contact_phone, created_at')
            .maybeSingle()
          if (error) throw error
          return { data: data || {} }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Settings']
    }),

    updateBusinessSettings: builder.mutation({
      queryFn: async (settings) => {
        try {
          const { data: existing } = await supabase
            .from('business_settings')
            .select('id')
            .maybeSingle()
          
          let result;
          if (existing) {
            result = await supabase
              .from('business_settings')
              .update(settings)
              .eq('id', existing.id)
              .select('id, company_name, gst_number, address, contact_email, contact_phone, created_at')
              .single()
          } else {
            result = await supabase
              .from('business_settings')
              .insert([settings])
              .select('id, company_name, gst_number, address, contact_email, contact_phone, created_at')
              .single()
          }

          if (result.error) throw result.error
          return { data: result.data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Settings']
    }),
    
    // ============================================================================
    // ACTIVITY LOGS ENDPOINTS
    // ============================================================================

    getActivityLogs: builder.query({
      queryFn: async ({ page=1, limit=20 }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          const { data, error, count } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)
          
          if (error) throw error
          return { data: { logs: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Logs']
    }),

    // ============================================================================
    // ALL PAYMENTS (for Payments page)
    // ============================================================================

    getPayments: builder.query({
      queryFn: async ({ page = 1, limit = 20 }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          const { data, error, count } = await supabase
            .from('payments')
            .select('*, invoices(invoice_number, projects(leads(name)))', { count: 'exact' })
            .order('payment_date', { ascending: false })
            .range(from, to)
          
          if (error) throw error
          return { data: { payments: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Payments']
    }),

    // ============================================================================
    // ADVANCED PAYMENTS ENDPOINTS
    // ============================================================================

    /**
     * Get payments with full details (invoices, projects, leads)
     * Supports advanced filtering, search, sorting, and pagination
     */
    getPaymentsWithDetails: builder.query({
      queryFn: async ({
        page = 1,
        limit = 20,
        search = '',
        paymentMode = '',
        city = '',
        state = '',
        projectId = '',
        invoiceId = '',
        paymentDateFrom = '',
        paymentDateTo = '',
        amountMin = '',
        amountMax = '',
        sortBy = 'newest' // newest, oldest, highest, lowest
      }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1

          // Base query with deep joins
          let query = supabase
            .from('payments')
            .select(`
              *,
              invoices (
                id,
                invoice_number,
                invoice_amount,
                gst_amount,
                payment_status,
                invoice_date,
                due_date,
                projects (
                  id,
                  project_name,
                  project_status,
                  leads (
                    id,
                    name,
                    email,
                    phone_number,
                    city,
                    state
                  )
                )
              )
            `, { count: 'exact' })

          // Apply filters
          if (paymentMode) {
            query = query.eq('payment_mode', paymentMode)
          }

          if (projectId) {
            query = query.eq('invoices.projects.id', projectId)
          }

          if (invoiceId) {
            query = query.eq('invoice_id', invoiceId)
          }

          if (paymentDateFrom) {
            query = query.gte('payment_date', paymentDateFrom)
          }

          if (paymentDateTo) {
            query = query.lte('payment_date', paymentDateTo)
          }

          if (amountMin) {
            query = query.gte('paid_amount', Number(amountMin))
          }

          if (amountMax) {
            query = query.lte('paid_amount', Number(amountMax))
          }

          // Sorting
          switch (sortBy) {
            case 'oldest':
              query = query.order('payment_date', { ascending: true })
              break
            case 'highest':
              query = query.order('paid_amount', { ascending: false })
              break
            case 'lowest':
              query = query.order('paid_amount', { ascending: true })
              break
            case 'newest':
            default:
              query = query.order('payment_date', { ascending: false })
          }

          query = query.range(from, to)

          const { data: payments, error, count } = await query

          if (error) throw error

          if (!payments || payments.length === 0) {
            return {
              data: {
                payments: [],
                total: count || 0
              }
            }
          }

          // Enrich payment data
          const enrichedPayments = payments.map(payment => {
            const invoice = payment.invoices || {}
            const project = invoice.projects || {}
            const lead = project.leads || {}
            
            return {
              ...payment,
              invoice_number: invoice.invoice_number || 'N/A',
              invoice_total: Number(invoice.invoice_amount || 0) + Number(invoice.gst_amount || 0),
              invoice_status: invoice.payment_status || 'pending',
              project_name: project.project_name || 'N/A',
              customer_name: lead.name || 'N/A',
              customer_phone: lead.phone_number || '',
              customer_email: lead.email || '',
              customer_city: lead.city || '',
              customer_state: lead.state || ''
            }
          })

          // Apply client-side filters for search, city, state
          let filteredPayments = enrichedPayments

          if (search) {
            const searchLower = search.toLowerCase()
            filteredPayments = filteredPayments.filter(p =>
              p.transaction_ref?.toLowerCase().includes(searchLower) ||
              p.invoice_number?.toLowerCase().includes(searchLower) ||
              p.customer_name?.toLowerCase().includes(searchLower) ||
              p.customer_phone?.includes(search)
            )
          }

          if (city) {
            filteredPayments = filteredPayments.filter(p =>
              p.customer_city?.toLowerCase().includes(city.toLowerCase())
            )
          }

          if (state) {
            filteredPayments = filteredPayments.filter(p =>
              p.customer_state?.toLowerCase().includes(state.toLowerCase())
            )
          }

          return {
            data: {
              payments: filteredPayments,
              total: filteredPayments.length
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Payments', 'Invoices']
    }),

    /**
     * Get payment analytics and KPIs
     */
    getPaymentAnalytics: builder.query({
      queryFn: async (filters = {}) => {
        try {
          // Fetch all payments with filters (no pagination for analytics)
          let query = supabase
            .from('payments')
            .select(`
              *,
              invoices (
                projects (
                  leads (
                    city,
                    state
                  )
                )
              )
            `)

          // Apply date filters if provided
          if (filters.paymentDateFrom) {
            query = query.gte('payment_date', filters.paymentDateFrom)
          }
          if (filters.paymentDateTo) {
            query = query.lte('payment_date', filters.paymentDateTo)
          }
          if (filters.paymentMode) {
            query = query.eq('payment_mode', filters.paymentMode)
          }

          const { data: payments, error } = await query

          if (error) throw error

          const today = format(new Date(), 'yyyy-MM-dd')
          const thisMonthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
          const thisYearStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')

          // Calculate KPIs
          const totalCount = payments?.length || 0
          const totalAmount = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0
          
          const todayPayments = payments?.filter(p => p.payment_date === today) || []
          const todayAmount = todayPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0)

          const monthPayments = payments?.filter(p => p.payment_date >= thisMonthStart) || []
          const monthAmount = monthPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0)

          const yearPayments = payments?.filter(p => p.payment_date >= thisYearStart) || []
          const yearAmount = yearPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0)

          // Payment mode breakdown
          const modeBreakdown = {
            upi: 0,
            bank_transfer: 0,
            cash: 0,
            cheque: 0,
            online: 0,
            other: 0
          }

          payments?.forEach(p => {
            const mode = p.payment_mode || 'other'
            modeBreakdown[mode] = (modeBreakdown[mode] || 0) + Number(p.paid_amount || 0)
          })

          const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0
          const highestAmount = payments?.length > 0 
            ? Math.max(...payments.map(p => Number(p.paid_amount || 0))) 
            : 0

          // City-wise breakdown
          const cityBreakdown = {}
          payments?.forEach(p => {
            const city = p.invoices?.projects?.leads?.city || 'Unknown'
            cityBreakdown[city] = (cityBreakdown[city] || 0) + Number(p.paid_amount || 0)
          })

          // Trend data (last 30 days)
          const trendData = []
          for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = format(date, 'yyyy-MM-dd')
            const dayPayments = payments?.filter(p => p.payment_date === dateStr) || []
            const dayAmount = dayPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0)
            
            trendData.push({
              date: format(date, 'MMM dd'),
              amount: dayAmount,
              count: dayPayments.length
            })
          }

          return {
            data: {
              totalCount,
              totalAmount,
              todayAmount,
              monthAmount,
              yearAmount,
              avgAmount,
              highestAmount,
              modeBreakdown,
              cityBreakdown,
              trendData
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Payments']
    }),

    /**
     * Create payment with auto invoice status update
     */
    createPaymentWithStatus: builder.mutation({
      queryFn: async (paymentData) => {
        try {
          // 1. Insert payment
          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentData)
            .select()
            .single()

          if (paymentError) throw paymentError

          // 2. Recalculate invoice status
          await recalculateInvoiceStatus(paymentData.invoice_id)

          return { data: payment }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Payments', 'Invoices', 'InvoiceAnalytics']
    }),

    /**
     * Update payment with auto invoice status update
     */
    updatePaymentWithStatus: builder.mutation({
      queryFn: async ({ id, invoice_id, ...updates }) => {
        try {
          // 1. Update payment
          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

          if (paymentError) throw paymentError

          // 2. Recalculate invoice status
          await recalculateInvoiceStatus(invoice_id)

          return { data: payment }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Payments', 'Invoices', 'InvoiceAnalytics']
    }),

    /**
     * Delete payment with auto invoice status update
     */
    deletePaymentWithStatus: builder.mutation({
      queryFn: async ({ id, invoice_id }) => {
        try {
          // 1. Delete payment
          const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('id', id)

          if (deleteError) throw deleteError

          // 2. Recalculate invoice status
          await recalculateInvoiceStatus(invoice_id)

          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Payments', 'Invoices', 'InvoiceAnalytics']
    }),

    /**
     * Bulk delete payments
     */
    bulkDeletePayments: builder.mutation({
      queryFn: async (paymentIds) => {
        try {
          // Get invoice IDs before deleting
          const { data: payments } = await supabase
            .from('payments')
            .select('invoice_id')
            .in('id', paymentIds)

          const invoiceIds = [...new Set(payments?.map(p => p.invoice_id) || [])]

          // Delete payments
          const { error } = await supabase
            .from('payments')
            .delete()
            .in('id', paymentIds)

          if (error) throw error

          // Recalculate status for all affected invoices
          await Promise.all(invoiceIds.map(id => recalculateInvoiceStatus(id)))

          return { data: paymentIds }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Payments', 'Invoices', 'InvoiceAnalytics']
    }),

    // ============================================================================
    // LEGACY PAYMENTS ENDPOINT (Keep for backward compatibility)
    // ============================================================================
    getPayments: builder.query({
      queryFn: async ({ page = 1, limit = 10 }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          const { data, error, count } = await supabase
            .from('payments')
            .select('*, invoices(invoice_number, projects(leads(name)))', { count: 'exact' })
            .order('payment_date', { ascending: false })
            .range(from, to)
          
          if (error) throw error
          return { data: { payments: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Payments']
    }),

    // ============================================================================
    // ADVANCED EXPENSES ENDPOINTS
    // ============================================================================

    /**
     * Get expenses with full details (categories, projects, leads)
     */
    getExpensesWithDetails: builder.query({
      queryFn: async ({
        page = 1,
        limit = 20,
        search = '',
        categoryId = '',
        projectId = '',
        expenseDateFrom = '',
        expenseDateTo = '',
        amountMin = '',
        amountMax = '',
        expenseType = '', // 'project' or 'general'
        sortBy = 'newest'
      }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1

          let query = supabase
            .from('expenses')
            .select(`
              *,
              expense_categories (
                id,
                name
              ),
              projects (
                id,
                project_name,
                leads (
                  id,
                  name,
                  phone_number
                )
              )
            `, { count: 'exact' })

          // Apply filters
          if (categoryId) {
            query = query.eq('category_id', categoryId)
          }

          if (projectId) {
            query = query.eq('project_id', projectId)
          }

          if (expenseDateFrom) {
            query = query.gte('expense_date', expenseDateFrom)
          }

          if (expenseDateTo) {
            query = query.lte('expense_date', expenseDateTo)
          }

          if (amountMin) {
            query = query.gte('amount', Number(amountMin))
          }

          if (amountMax) {
            query = query.lte('amount', Number(amountMax))
          }

          if (expenseType === 'project') {
            query = query.not('project_id', 'is', null)
          } else if (expenseType === 'general') {
            query = query.is('project_id', null)
          }

          // Sorting
          switch (sortBy) {
            case 'oldest':
              query = query.order('expense_date', { ascending: true })
              break
            case 'highest':
              query = query.order('amount', { ascending: false })
              break
            case 'lowest':
              query = query.order('amount', { ascending: true })
              break
            case 'newest':
            default:
              query = query.order('expense_date', { ascending: false })
          }

          query = query.range(from, to)

          const { data: expenses, error, count } = await query

          if (error) throw error

          if (!expenses || expenses.length === 0) {
            return {
              data: {
                expenses: [],
                total: count || 0
              }
            }
          }

          // Enrich expense data
          const enrichedExpenses = expenses.map(expense => ({
            ...expense,
            category_name: expense.expense_categories?.name || 'Uncategorized',
            project_name: expense.projects?.project_name || '—',
            customer_name: expense.projects?.leads?.name || '—',
            customer_phone: expense.projects?.leads?.phone_number || '',
            is_project_expense: !!expense.project_id
          }))

          // Apply client-side search filter
          let filteredExpenses = enrichedExpenses

          if (search) {
            const searchLower = search.toLowerCase()
            filteredExpenses = filteredExpenses.filter(e =>
              e.description?.toLowerCase().includes(searchLower) ||
              e.category_name?.toLowerCase().includes(searchLower) ||
              e.project_name?.toLowerCase().includes(searchLower)
            )
          }

          return {
            data: {
              expenses: filteredExpenses,
              total: filteredExpenses.length
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Expenses']
    }),

    /**
     * Get expense analytics
     */
    getExpenseAnalytics: builder.query({
      queryFn: async (filters = {}) => {
        try {
          let query = supabase
            .from('expenses')
            .select(`
              *,
              expense_categories (name)
            `)

          if (filters.expenseDateFrom) {
            query = query.gte('expense_date', filters.expenseDateFrom)
          }
          if (filters.expenseDateTo) {
            query = query.lte('expense_date', filters.expenseDateTo)
          }
          if (filters.categoryId) {
            query = query.eq('category_id', filters.categoryId)
          }

          const { data: expenses, error } = await query

          if (error) throw error

          const today = format(new Date(), 'yyyy-MM-dd')
          const thisMonthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
          const thisYearStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')

          const totalCount = expenses?.length || 0
          const totalAmount = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0

          const todayExpenses = expenses?.filter(e => e.expense_date === today) || []
          const todayAmount = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

          const monthExpenses = expenses?.filter(e => e.expense_date >= thisMonthStart) || []
          const monthAmount = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

          const yearExpenses = expenses?.filter(e => e.expense_date >= thisYearStart) || []
          const yearAmount = yearExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

          const projectExpenses = expenses?.filter(e => e.project_id) || []
          const projectAmount = projectExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

          const generalExpenses = expenses?.filter(e => !e.project_id) || []
          const generalAmount = generalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

          const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0
          const highestAmount = expenses?.length > 0
            ? Math.max(...expenses.map(e => Number(e.amount || 0)))
            : 0

          // Category breakdown
          const categoryBreakdown = {}
          expenses?.forEach(e => {
            const category = e.expense_categories?.name || 'Uncategorized'
            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(e.amount || 0)
          })

          // Trend data (last 30 days)
          const trendData = []
          for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = format(date, 'yyyy-MM-dd')
            const dayExpenses = expenses?.filter(e => e.expense_date === dateStr) || []
            const dayAmount = dayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

            trendData.push({
              date: format(date, 'MMM dd'),
              amount: dayAmount,
              count: dayExpenses.length
            })
          }

          return {
            data: {
              totalCount,
              totalAmount,
              todayAmount,
              monthAmount,
              yearAmount,
              projectAmount,
              generalAmount,
              avgAmount,
              highestAmount,
              categoryBreakdown,
              trendData
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Expenses']
    }),

    /**
     * Get profit/loss data
     */
    getProfitLossData: builder.query({
      queryFn: async ({ dateFrom = '', dateTo = '' }) => {
        try {
          // Get payments (revenue)
          let paymentsQuery = supabase
            .from('payments')
            .select('paid_amount, payment_date')

          if (dateFrom) paymentsQuery = paymentsQuery.gte('payment_date', dateFrom)
          if (dateTo) paymentsQuery = paymentsQuery.lte('payment_date', dateTo)

          const { data: payments } = await paymentsQuery

          // Get expenses
          let expensesQuery = supabase
            .from('expenses')
            .select('amount, expense_date')

          if (dateFrom) expensesQuery = expensesQuery.gte('expense_date', dateFrom)
          if (dateTo) expensesQuery = expensesQuery.lte('expense_date', dateTo)

          const { data: expenses } = await expensesQuery

          const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0
          const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0
          const netProfit = totalRevenue - totalExpenses
          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

          // Monthly comparison (last 6 months)
          const monthlyData = []
          for (let i = 5; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const monthStart = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd')
            const monthEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd')

            const monthPayments = payments?.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd) || []
            const monthExpenses = expenses?.filter(e => e.expense_date >= monthStart && e.expense_date <= monthEnd) || []

            const revenue = monthPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0)
            const expense = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

            monthlyData.push({
              month: format(date, 'MMM yyyy'),
              revenue,
              expense,
              profit: revenue - expense
            })
          }

          return {
            data: {
              totalRevenue,
              totalExpenses,
              netProfit,
              profitMargin,
              monthlyData
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Payments', 'Expenses']
    }),

    /**
     * Get expense categories
     */
    getExpenseCategories: builder.query({
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('name', { ascending: true })

          if (error) throw error
          return { data: data || [] }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['ExpenseCategories']
    }),

    /**
     * Create expense
     */
    createExpense: builder.mutation({
      queryFn: async (expenseData) => {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .insert(expenseData)
            .select()
            .single()

          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Expenses']
    }),

    /**
     * Update expense
     */
    updateExpense: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Expenses']
    }),

    /**
     * Delete expense
     */
    deleteExpense: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)

          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Expenses']
    }),

    /**
     * Create expense category
     */
    createExpenseCategory: builder.mutation({
      queryFn: async (categoryData) => {
        try {
          const { data, error } = await supabase
            .from('expense_categories')
            .insert(categoryData)
            .select()
            .single()

          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['ExpenseCategories']
    }),

    /**
     * Update expense category
     */
    updateExpenseCategory: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase
            .from('expense_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['ExpenseCategories']
    }),

    /**
     * Delete expense category
     */
    deleteExpenseCategory: builder.mutation({
      queryFn: async (id) => {
        try {
          // Check if category is in use
          const { data: expenses } = await supabase
            .from('expenses')
            .select('id')
            .eq('category_id', id)
            .limit(1)

          if (expenses && expenses.length > 0) {
            throw new Error('Cannot delete category that is in use')
          }

          const { error } = await supabase
            .from('expense_categories')
            .delete()
            .eq('id', id)

          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['ExpenseCategories']
    }),
  })
})

export const {
  // Enhanced Invoice Endpoints
  useGetInvoicesWithDetailsQuery,
  useGetInvoiceAnalyticsQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useBulkDeleteInvoicesMutation,
  useBulkUpdateInvoiceStatusMutation,
  
  // Payment Endpoints (Invoice-specific)
  useGetPaymentsForInvoiceQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  
  // Advanced Payment Endpoints
  useGetPaymentsWithDetailsQuery,
  useGetPaymentAnalyticsQuery,
  useCreatePaymentWithStatusMutation,
  useUpdatePaymentWithStatusMutation,
  useDeletePaymentWithStatusMutation,
  useBulkDeletePaymentsMutation,
  
  // Legacy Invoice Endpoints
  useGetInvoicesQuery,
  useGetInvoiceDetailsQuery,
  useUpdateInvoiceStatusMutation,
  
  // Advanced Expense Endpoints
  useGetExpensesWithDetailsQuery,
  useGetExpenseAnalyticsQuery,
  useGetProfitLossDataQuery,
  useGetExpenseCategoriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  
  // Legacy Expense Endpoints
  useGetExpensesQuery,
  useAddExpenseMutation,
  
  // Other Endpoints
  useGetBusinessSettingsQuery,
  useUpdateBusinessSettingsMutation,
  useGetActivityLogsQuery,
  useGetPaymentsQuery,
} = financeApi

