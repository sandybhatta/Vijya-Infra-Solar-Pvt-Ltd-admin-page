import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '@/lib/supabaseClient'

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Fake base URL for Supabase
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      queryFn: async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

          // Parallelize queries for performance
          const [
            leadsTotalRes,
            leadsTodayRes,
            leadsMonthRes,
            leadsConvertedRes,
            projectsTotalRes,
            projectsOngoingRes,
            projectsCompletedRes,
            revenueRes,
            expensesRes,
            materialCostsRes,
            overdueInvoicesRes,
            lowStockRes,
            usersTotalRes,
            usersTodayRes
          ] = await Promise.all([
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
            supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('project_status', 'ongoing'), // Schema: project_status
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('project_status', 'completed'), // Schema: project_status
            supabase.from('payments').select('paid_amount'), // Schema: paid_amount
            supabase.from('expenses').select('amount'),
            supabase.from('project_materials').select('quantity, total_cost'), // Schema: total_cost exists directly
            supabase.from('invoices').select('invoice_amount').lt('due_date', today).eq('payment_status', 'pending'), // Schema: invoice_amount
            supabase.from('inventory_stock').select('*', { count: 'exact', head: true }).lt('quantity_available', 10), // Schema: inventory_stock(quantity_available)
            supabase.from('Users').select('*', { count: 'exact', head: true }),
            supabase.from('Users').select('*', { count: 'exact', head: true }).gte('created_at', today)
          ])

          // Helper to safely get count or data
          const getCount = (res) => res.error ? 0 : (res.count || 0)
          const getData = (res) => res.error ? [] : (res.data || [])

          // Calcs
          const totalRevenue = getData(revenueRes).reduce((sum, p) => sum + (p.paid_amount || 0), 0)
          const totalExpenses = getData(expensesRes).reduce((sum, e) => sum + (e.amount || 0), 0)
          
          // Calculate material costs: project_materials has total_cost column
          const totalMaterialCost = getData(materialCostsRes).reduce((sum, item) => sum + (item.total_cost || 0), 0)

          // Simplified Profit (Revenue - Expenses - Materials)
          const netProfit = totalRevenue - totalExpenses - totalMaterialCost

          const outstandingInvoiceAmount = getData(overdueInvoicesRes).reduce((sum, i) => sum + (i.invoice_amount || 0), 0)

          // Combine CRM Leads + Website Users for KPI
          const totalLeadsCount = getCount(leadsTotalRes) + getCount(usersTotalRes)
          const leadsTodayCount = getCount(leadsTodayRes) + getCount(usersTodayRes)

          return { data: {
            totalLeads: totalLeadsCount,
            leadsToday: leadsTodayCount,
            leadsMonth: getCount(leadsMonthRes), // Maybe sum users here too? For simplicity, just total/today as requested.
            totalProjects: getCount(projectsTotalRes),
            ongoingProjects: getCount(projectsOngoingRes),
            completedProjects: getCount(projectsCompletedRes),
            conversionRate: (((getCount(projectsTotalRes)) / (totalLeadsCount || 1)) * 100).toFixed(1),
            ongoingProjects: getCount(projectsOngoingRes),
            completedProjects: getCount(projectsCompletedRes),
            totalRevenue,
            totalExpenses,
            netProfit,
            outstandingInvoiceAmount,
            overdueInvoiceCount: getData(overdueInvoicesRes).length,
            lowStockCount: getCount(lowStockRes)
          }}
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Dashboard'],
    }),
    getRevenueTrend: builder.query({
         queryFn: async () => {
             // Mocking trend data for now
             return { data: [
                 { name: 'Jan', revenue: 4000, profit: 2400 },
                 { name: 'Feb', revenue: 3000, profit: 1398 },
                 { name: 'Mar', revenue: 2000, profit: 9800 },
                 { name: 'Apr', revenue: 2780, profit: 3908 },
                 { name: 'May', revenue: 1890, profit: 4800 },
                 { name: 'Jun', revenue: 2390, profit: 3800 },
                 { name: 'Jul', revenue: 3490, profit: 4300 },
             ]}
         }
    }),
    getLeadSources: builder.query({
        queryFn: async () => {
             // source_id is in leads, but we need the name from lead_sources
             // querying leads directly first, if source_id is null we check other fields? 
             // Schema says: leads has source_id. It does NOT have 'source' string column.
             // But wait, the previous code ran select('source') and it failed 400, confirming 'source' column does NOT exist.
             // We need to fetch lead_sources join or just group by known IDs.
             // For now, let's try to join lead_sources.
             const { data, error } = await supabase.from('leads').select('source_id')
             if (error) return { data: [] } 
             
             // We need names for these IDs. Fetch inputs
             const { data: sources } = await supabase.from('lead_sources').select('id, name')
             const sourceMap = (sources || []).reduce((acc, s) => ({...acc, [s.id]: s.name}), {})

             const counts = (data || []).reduce((acc, lead) => {
                 const srcName = sourceMap[lead.source_id] || 'Direct/Unknown'
                 acc[srcName] = (acc[srcName] || 0) + 1
                 return acc
             }, {})
             return { data: Object.keys(counts).map(k => ({ name: k, value: counts[k] })) }
        },
        providesTags: ['Dashboard']
    })
  })
})

export const { useGetDashboardStatsQuery, useGetRevenueTrendQuery, useGetLeadSourcesQuery } = dashboardApi
