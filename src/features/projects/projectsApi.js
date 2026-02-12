import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const projectsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      queryFn: async ({ page = 1, limit = 100, search = '', status = '', solarType = '', sortBy = 'newest' }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          
          let query = supabase
            .from('projects')
            .select(`
              *,
              leads(name, city, state),
              invoices(invoice_amount, payment_status),
              expenses(amount),
              project_materials(total_cost)
            `, { count: 'exact' })
            .order('created_at', { ascending: sortBy === 'oldest' })

          if (search) {
            query = query.or(`project_name.ilike.%${search}%, installation_address.ilike.%${search}%`)
          }
          if (status && status !== 'all') {
            query = query.eq('project_status', status)
          }
          if (solarType && solarType !== 'all') {
            query = query.eq('solar_type', solarType)
          }

          if (sortBy === 'highest_revenue') {
             // Sorting complex aggregations is hard in PostgREST, we'll do basic sorting here
             // or handle it in JS if data size is small. For ERP, we'll stick to created_at
             // and let the frontend sort for now since we're fetching 100 items.
          }

          const { data, error, count } = await query
          if (error) throw error

          // Attach Payment Totals (Payments are via Invoices)
          const invoiceIds = data.flatMap(p => p.invoices?.map(i => i.id) || [])
          let payments = []
          if (invoiceIds.length > 0) {
            const { data: payData } = await supabase.from('payments').select('invoice_id, paid_amount').in('invoice_id', invoiceIds)
            payments = payData || []
          }

          const enhancedProjects = data.map(project => {
            const totalInvoiced = (project.invoices || []).reduce((sum, inv) => sum + Number(inv.invoice_amount || 0), 0)
            const totalPaid = (project.invoices || []).reduce((sum, inv) => {
              const invPayments = payments.filter(p => p.invoice_id === inv.id)
              return sum + invPayments.reduce((s, p) => s + Number(p.paid_amount || 0), 0)
            }, 0)
            const totalExpenses = (project.expenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
            const materialCosts = (project.project_materials || []).reduce((sum, mat) => sum + Number(mat.total_cost || 0), 0)
            const totalCost = totalExpenses + materialCosts
            const profit = totalPaid - totalCost
            
            return {
              ...project,
              total_invoiced: totalInvoiced,
              total_paid: totalPaid,
              total_expenses: totalCost,
              net_profit: profit,
              profit_margin: totalPaid > 0 ? (profit / totalPaid) * 100 : 0,
              pending_amount: totalInvoiced - totalPaid
            }
          })

          return { data: { projects: enhancedProjects, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Projects'],
    }),
    getProjectDetails: builder.query({
        queryFn: async (id) => {
            try {
                const { data: project, error } = await supabase
                  .from('projects')
                  .select('*, leads(*)')
                  .eq('id', id)
                  .single()
                
                if (error) throw error
                
                // Parallel fetch for related entities
                const [
                    { data: invoices },
                    { data: expenses },
                    { data: materials },
                    { data: tasks },
                    { data: quotation }
                ] = await Promise.all([
                    supabase.from('invoices').select('*').eq('project_id', id).order('created_at', { ascending: false }),
                    supabase.from('expenses').select('*').eq('project_id', id).order('expense_date', { ascending: false }),
                    supabase.from('project_materials').select('*, materials(*)').eq('project_id', id),
                    supabase.from('employee_tasks').select('*, employees(name)').eq('project_id', id).order('scheduled_date', { ascending: true }),
                    project.lead_id ? supabase.from('quotations').select('*').eq('lead_id', project.lead_id).maybeSingle() : Promise.resolve({ data: null })
                ])

                // Fetch payments for these invoices
                const invoiceIds = (invoices || []).map(inv => inv.id)
                let payments = []
                if (invoiceIds.length > 0) {
                  const { data: payData } = await supabase.from('payments').select('*').in('invoice_id', invoiceIds).order('payment_date', { ascending: false })
                  payments = payData || []
                }

                return { data: { ...project, invoices, expenses, materials, tasks, quotation, payments } }
            } catch (error) {
                return { error: error.message }
            }
        },
        providesTags: (result, error, id) => [{ type: 'Projects', id }]
    }),
    getProjectStats: builder.query({
      queryFn: async () => {
        try {
          const { data: projects, error } = await supabase.from('projects').select('project_status, created_at')
          if (error) throw error
          
          const { data: payments } = await supabase.from('payments').select('paid_amount, payment_date')
          const { data: expenses } = await supabase.from('expenses').select('amount, expense_date')
          const { data: matCosts } = await supabase.from('project_materials').select('total_cost')

          return { data: { projects, payments, expenses, matCosts } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Projects', 'Invoices', 'Payments', 'Expenses']
    }),
    addProject: builder.mutation({
      queryFn: async (newProject) => {
        try {
          const { data, error } = await supabase.from('projects').insert([newProject]).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Projects', 'Dashboard'],
    }),
    updateProject: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: (result, error, { id }) => ['Projects', 'Dashboard', { type: 'Projects', id }],
    }),
    deleteProject: builder.mutation({
        queryFn: async (id) => {
            try {
                 const { error } = await supabase.from('projects').delete().eq('id', id)
                 if (error) throw error
                 return { data: id }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Projects', 'Dashboard']
    }),
    allocateMaterial: builder.mutation({
        queryFn: async ({ project_id, material_id, quantity }) => {
            try {
                // 1. Check stock
                const { data: stock, error: stockError } = await supabase
                    .from('inventory_stock')
                    .select('quantity_available, id')
                    .eq('material_id', material_id)
                    .single()
                
                if (stockError || !stock) throw new Error("Material not found in stock")
                if (stock.quantity_available < quantity) throw new Error(`Insufficient stock. Available: ${stock.quantity_available}`)

                // 2. Insert into project_materials
                const { data: item, error: insertError } = await supabase
                    .from('project_materials')
                    .insert([{ project_id, material_id, quantity, assigned_at: new Date() }])
                    .select()
                
                if (insertError) throw insertError

                // 3. Deduct from inventory_stock
                const { error: updateError } = await supabase
                    .from('inventory_stock')
                    .update({ quantity_available: stock.quantity_available - quantity })
                    .eq('id', stock.id)
                
                if (updateError) throw updateError

                // 4. Log it
                await supabase.from('inventory_logs').insert([{
                    material_id,
                    change_type: 'out',
                    quantity,
                    note: `Allocated to Project ${project_id}`,
                    created_by: (await supabase.auth.getUser()).data.user?.id || null
                }])

                return { data: item[0] }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Projects', 'Inventory']
    }),
    removeAllocatedMaterial: builder.mutation({
        queryFn: async ({ id, project_id, material_id, quantity }) => {
             try {
                 // 1. Remove from project_materials
                 const { error: delError } = await supabase.from('project_materials').delete().eq('id', id)
                 if (delError) throw delError

                 // 2. Return to inventory
                 const { data: stock } = await supabase.from('inventory_stock').eq('material_id', material_id).single()
                 if (stock) {
                     await supabase.from('inventory_stock').update({ quantity_available: (stock.quantity_available || 0) + quantity }).eq('id', stock.id)
                     
                     // Log return
                     await supabase.from('inventory_logs').insert([{
                        material_id,
                        action_type: 'in',
                        quantity,
                        note: `Removed from Project ${project_id}`,
                        created_by: (await supabase.auth.getUser()).data.user?.id || null
                    }])
                 }
                 return { data: id }
             } catch (error) {
                 return { error: error.message }
             }
        },
        invalidatesTags: ['Projects', 'Inventory']
    })
  }),
})

export const { 
    useGetProjectsQuery, 
    useGetProjectDetailsQuery,
    useGetProjectStatsQuery,
    useAddProjectMutation, 
    useUpdateProjectMutation,
    useDeleteProjectMutation,
    useAllocateMaterialMutation,
    useRemoveAllocatedMaterialMutation
} = projectsApi
