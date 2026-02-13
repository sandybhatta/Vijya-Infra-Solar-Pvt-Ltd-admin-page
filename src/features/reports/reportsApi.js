import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '@/lib/supabaseClient'

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Reports', 'Presets', 'Notes'],
  endpoints: (builder) => ({
    // GLOBAL ANALYTICS FETCH
    // We pass filters and let the queryFn handle complex supabase chains
    getGlobalAnalytics: builder.query({
      queryFn: async (filters) => {
        try {
          const { dateRange, city, state, solarType, leadSource, campaign, projectStatus, search } = filters || {}
          
          // Helper: Apply filters to a query
          const applyFilters = (query) => {
            if (dateRange?.start) query.gte('created_at', dateRange.start)
            if (dateRange?.end) query.lte('created_at', dateRange.end)
            if (city && city !== 'all') query.eq('city', city)
            if (state && state !== 'all') query.eq('state', state)
            if (solarType && solarType !== 'all') query.eq('solar_type', solarType)
            // leadSource, campaign, search etc depending on table
            return query
          }

          // Parallel Fetching for all sections
          const [
            leadsRes,
            projectsRes,
            financeRes,
            expensesRes,
            inventoryRes,
            employeesRes,
            historyRes,
            campaignsRes
          ] = await Promise.all([
            applyFilters(supabase.from('leads').select('*')),
            applyFilters(supabase.from('projects').select('*, leads(name, city, state), project_materials(quantity, total_cost)')),
            applyFilters(supabase.from('payments').select('*')),
            applyFilters(supabase.from('expenses').select('*')),
            supabase.from('inventory_stock').select('*'),
            supabase.from('employees').select('*, employee_tasks(*)'),
            applyFilters(supabase.from('lead_status_history').select('*')),
            supabase.from('marketing_campaigns').select('*')
          ])

          return { data: {
            leads: leadsRes.data || [],
            projects: projectsRes.data || [],
            finance: financeRes.data || [],
            expenses: expensesRes.data || [],
            inventory: inventoryRes.data || [],
            employees: employeesRes.data || [],
            history: historyRes.data || [],
            campaigns: campaignsRes.data || []
          }}
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Reports']
    }),

    // PRESETS CRUD
    getPresets: builder.query({
      queryFn: async () => {
        const { data, error } = await supabase.from('report_presets').select('*').order('created_at', { ascending: false })
        if (error) return { error: error.message }
        return { data }
      },
      providesTags: ['Presets']
    }),
    savePreset: builder.mutation({
      queryFn: async (preset) => {
        const { data, error } = await supabase.from('report_presets').insert([preset]).select()
        if (error) return { error: error.message }
        return { data: data[0] }
      },
      invalidatesTags: ['Presets']
    }),
    deletePreset: builder.mutation({
       queryFn: async (id) => {
         const { error } = await supabase.from('report_presets').delete().eq('id', id)
         if (error) return { error: error.message }
         return { data: id }
       },
       invalidatesTags: ['Presets']
    }),

    // NOTES CRUD
    getNotes: builder.query({
        queryFn: async () => {
          const { data, error } = await supabase.from('owner_notes').select('*').order('created_at', { ascending: false })
          if (error) return { error: error.message }
          return { data }
        },
        providesTags: ['Notes']
    }),
    addNote: builder.mutation({
        queryFn: async (note) => {
            const { data, error } = await supabase.from('owner_notes').insert([note]).select()
            if (error) return { error: error.message }
            return { data: data[0] }
        },
        invalidatesTags: ['Notes']
    }),
    deleteNote: builder.mutation({
        queryFn: async (id) => {
            const { error } = await supabase.from('owner_notes').delete().eq('id', id)
            if (error) return { error: error.message }
            return { data: id }
        },
        invalidatesTags: ['Notes']
    })
  })
})

export const { 
    useGetGlobalAnalyticsQuery, 
    useGetPresetsQuery, 
    useSavePresetMutation, 
    useDeletePresetMutation,
    useGetNotesQuery,
    useAddNoteMutation,
    useDeleteNoteMutation
} = reportsApi
