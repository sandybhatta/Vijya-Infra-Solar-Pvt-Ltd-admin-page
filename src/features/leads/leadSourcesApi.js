import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const leadSourcesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Lead Sources with List Stats (Uses get_lead_sources_stats RPC)
    getLeadSources: builder.query({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.rpc('get_lead_sources_stats')
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['LeadSources'],
    }),

    // 2. Global KPI Stats (Uses get_lead_sources_global_kpis RPC)
    getLeadSourceStats: builder.query({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.rpc('get_lead_sources_global_kpis')
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['LeadSourceStats'],
    }),

    // 3. Individual Source Intelligence (Funnel + Trends)
    getLeadSourceDetails: builder.query({
      queryFn: async (sourceId) => {
        try {
          const { data, error } = await supabase.rpc('get_lead_source_intelligence', { source_uuid: sourceId })
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: (result, error, id) => [{ type: 'LeadSources', id }],
    }),

    // 4. Latest Leads for a Source
    getLeadSourceLeads: builder.query({
      queryFn: async (sourceId) => {
        try {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('source_id', sourceId)
            .order('created_at', { ascending: false })
            .limit(10)
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),

    // --- CRUD ---

    createLeadSource: builder.mutation({
      queryFn: async (newSource) => {
        try {
          const { data, error } = await supabase.from('lead_sources').insert([newSource]).select()
          if (error) {
            if (error.code === '23505') throw new Error("A source with this name already exists")
            throw error
          }
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['LeadSources', 'LeadSourceStats'],
    }),

    updateLeadSource: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('lead_sources').update(updates).eq('id', id).select()
          if (error) {
            if (error.code === '23505') throw new Error("A source with this name already exists")
            throw error
          }
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: (result, error, { id }) => ['LeadSources', 'LeadSourceStats', { type: 'LeadSources', id }],
    }),

    deleteLeadSource: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase.from('lead_sources').delete().eq('id', id)
          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['LeadSources', 'LeadSourceStats', 'Leads'],
    }),

    // Helper to check for linked leads before delete
    checkLinkedLeads: builder.query({
        queryFn: async (sourceId) => {
            const { count, error } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('source_id', sourceId)
            if (error) return { error: error.message }
            return { data: count }
        }
    })
  }),
})

export const {
  useGetLeadSourcesQuery,
  useGetLeadSourceStatsQuery,
  useGetLeadSourceDetailsQuery,
  useGetLeadSourceLeadsQuery,
  useCreateLeadSourceMutation,
  useUpdateLeadSourceMutation,
  useDeleteLeadSourceMutation,
  useLazyCheckLinkedLeadsQuery // For the safety check
} = leadSourcesApi
