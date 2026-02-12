import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const leadsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query({
      queryFn: async ({ 
        page = 1, 
        limit = 10, 
        search = '', 
        status = [], 
        city = 'all',
        state = 'all',
        solarType = 'all',
        sourceId = 'all',
        campaignId = 'all',
        dateRange = null
      }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          
          let query = supabase
            .from('leads')
            .select('*, lead_sources(name), marketing_campaigns(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

          if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`)
          }
          if (status && status.length > 0) {
            query = query.in('status', status)
          }
          if (city && city !== 'all') query.eq('city', city)
          if (state && state !== 'all') query.eq('state', state)
          if (solarType && solarType !== 'all') query.eq('solar_type', solarType)
          if (sourceId && sourceId !== 'all') query.eq('source_id', sourceId)
          if (campaignId && campaignId !== 'all') query.eq('campaign_id', campaignId)
          if (dateRange?.from) query.gte('created_at', dateRange.from)
          if (dateRange?.to) query.lte('created_at', dateRange.to)

          const { data, error, count } = await query
          if (error) throw error
          
          return { data: { leads: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Leads'],
    }),
    getLeadKPIs: builder.query({
      queryFn: async () => {
        try {
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const [
                { count: total },
                { count: todayCount },
                { count: contacted },
                { count: converted },
                { data: quotations }
            ] = await Promise.all([
                supabase.from('leads').select('*', { count: 'exact', head: true }),
                supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
                supabase.from('quotations').select('quotation_amount').eq('quotation_status', 'accepted')
            ])

            const pipelineValue = quotations?.reduce((sum, q) => sum + (q.quotation_amount || 0), 0) || 0;
            const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

            return { data: { 
                total, 
                today: todayCount, 
                contacted, 
                converted, 
                pipelineValue,
                conversionRate
            } }
        } catch (error) {
           return { error: error.message }
        }
      },
      providesTags: ['Leads']
    }),
    getLeadInsights: builder.query({
        queryFn: async () => {
            try {
                // Get top city
                const { data: cityData } = await supabase.rpc('get_top_lead_city') // Fallback to raw if RPC missing
                
                // Get source performance
                const { data: sourcePerf } = await supabase.from('leads').select('status, lead_sources(name)')
                
                // Process on client for now if RPCs aren't ready
                const cityCounts = cityData || []
                
                return { data: { topCity: cityCounts[0], sourcePerf } }
            } catch (error) {
                return { error: error.message }
            }
        },
        providesTags: ['Leads']
    }),
    addLead: builder.mutation({
      queryFn: async (newLead) => {
        try {
          const { data, error } = await supabase.from('leads').insert([newLead]).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Leads', 'Dashboard'],
    }),
    updateLead: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Leads', 'Dashboard'],
    }),
    deleteLead: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase.from('leads').delete().eq('id', id)
          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Leads', 'Dashboard'],
    }),
    bulkDeleteLeads: builder.mutation({
        queryFn: async (ids) => {
             try {
                const { error } = await supabase.from('leads').delete().in('id', ids)
                if (error) throw error
                return { data: ids }
             } catch (error) {
                 return { error: error.message }
             }
        },
        invalidatesTags: ['Leads', 'Dashboard']
    }),
    bulkUpdateLeadsStatus: builder.mutation({
        queryFn: async ({ ids, status }) => {
            try {
                if (!ids || ids.length === 0) throw new Error("No leads selected")
                
                const { data, error } = await supabase
                    .from('leads')
                    .update({ status })
                    .in('id', ids)
                    .select()
                
                if (error) throw error
                return { data }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Leads', 'Dashboard']
    }),
    getLeadDetails: builder.query({
        queryFn: async (id) => {
            if (!id || id === 'new') return { data: null }
            try {
                const { data, error } = await supabase.from('leads').select('*, lead_sources(name), marketing_campaigns(name)').eq('id', id).single()
                if (error) throw error
                return { data }
            } catch (error) {
                return { error: error.message }
            }
        },
        providesTags: (result, error, id) => [{ type: 'Leads', id }]
    }),
    getLeadHistory: builder.query({
        queryFn: async (id) => {
            if (!id || id === 'new') return { data: [] }
            try {
                const { data, error } = await supabase
                    .from('lead_status_history')
                    .select('*')
                    .eq('lead_id', id)
                    .order('changed_at', { ascending: false })
                
                if (error) throw error
                return { data }
            } catch (error) {
                if (error.message?.includes('does not exist')) return { data: [] }
                return { error: error.message }
            }
        },
        providesTags: (result, error, id) => [{ type: 'Leads', id }]
    }),
    getAllLeadHistory: builder.query({
        queryFn: async ({ page = 1, limit = 20 }) => {
             try {
                const from = (page - 1) * limit
                const to = from + limit - 1
                const { data, error, count } = await supabase
                    .from('lead_status_history')
                    .select('*, leads(name)', { count: 'exact' })
                    .order('changed_at', { ascending: false })
                    .range(from, to)

                if (error) throw error
                return { data: { history: data, total: count } }
             } catch (error) {
                 return { error: error.message }
             }
        },
        providesTags: ['Leads']
    }),
    addLeadNote: builder.mutation({
        queryFn: async ({ lead_id, old_status, new_status, note }) => {
            try {
                 const { data, error } = await supabase
                    .from('lead_status_history')
                    .insert([{ 
                        lead_id, 
                        old_status, 
                        new_status, 
                        note, 
                        changed_by: (await supabase.auth.getUser()).data.user?.id,
                        changed_at: new Date() 
                    }])
                    .select()
                 
                 if (error) throw error
                 return { data: data[0] }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: (result, error, { lead_id }) => [{ type: 'Leads', id: lead_id }]
    }),
    // TASKS
    getLeadTasks: builder.query({
        queryFn: async (leadId) => {
            if (!leadId || leadId === 'new') return { data: [] }
            const { data, error } = await supabase
                .from('employee_tasks')
                .select('*, employees(name)')
                .eq('lead_id', leadId)
                .order('scheduled_date', { ascending: true })
            if (error) return { error: error.message }
            return { data }
        },
        providesTags: (result, error, leadId) => [{ type: 'Leads', id: leadId }, 'Tasks']
    }),
    createTask: builder.mutation({
        queryFn: async (task) => {
            const { data, error } = await supabase.from('employee_tasks').insert([task]).select()
            if (error) return { error: error.message }
            return { data: data[0] }
        },
        invalidatesTags: ['Tasks']
    }),
    updateTaskStatus: builder.mutation({
        queryFn: async ({ id, status }) => {
            const { data, error } = await supabase.from('employee_tasks').update({ status }).eq('id', id).select()
            if (error) return { error: error.message }
            return { data: data[0] }
        },
        invalidatesTags: ['Tasks']
    })
  }),
})

export const { 
    useGetLeadsQuery, 
    useAddLeadMutation, 
    useUpdateLeadMutation, 
    useDeleteLeadMutation, 
    useGetLeadKPIsQuery,
    useGetLeadInsightsQuery,
    useBulkDeleteLeadsMutation,
    useBulkUpdateLeadsStatusMutation,
    useGetLeadDetailsQuery,
    useGetLeadHistoryQuery,
    useGetAllLeadHistoryQuery,
    useAddLeadNoteMutation,
    useGetLeadTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskStatusMutation
} = leadsApi
