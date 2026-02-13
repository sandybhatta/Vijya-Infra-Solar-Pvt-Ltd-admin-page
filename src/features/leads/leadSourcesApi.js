import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const leadSourcesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Lead Sources with List Stats (Direct query + client-side calculation)
    getLeadSources: builder.query({
      queryFn: async () => {
        try {
          // Fetch lead sources
          const { data: sources, error: sourcesError } = await supabase
            .from('lead_sources')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (sourcesError) throw sourcesError
          
          // Fetch all leads to calculate stats
          const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('source_id, status')
          
          if (leadsError) throw leadsError
          
          // Calculate stats for each source
          const sourcesWithStats = sources?.map(source => {
            const sourceLeads = leads?.filter(l => l.source_id === source.id) || []
            const convertedLeads = sourceLeads.filter(l => l.status === 'converted')
            
            return {
              ...source,
              total_leads: sourceLeads.length,
              converted_leads: convertedLeads.length,
              conversion_rate: sourceLeads.length > 0 
                ? ((convertedLeads.length / sourceLeads.length) * 100).toFixed(1) 
                : 0
            }
          })
          
          return { data: sourcesWithStats }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['LeadSources'],
    }),

    // 2. Global KPI Stats (Direct query + client-side calculation)
    getLeadSourceStats: builder.query({
      queryFn: async () => {
        try {
          // Fetch all lead sources
          const { data: sources, error: sourcesError } = await supabase
            .from('lead_sources')
            .select('*')
          
          if (sourcesError) throw sourcesError
          
          // Fetch all leads
          const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('source_id, status, created_at')
          
          if (leadsError) throw leadsError
          
          // Calculate global KPIs
          const totalSources = sources?.length || 0
          const totalLeads = leads?.length || 0
          const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0
          const avgConversionRate = totalLeads > 0 
            ? ((convertedLeads / totalLeads) * 100).toFixed(1) 
            : 0
          
          // Find most productive source
          const sourceLeadCounts = {}
          leads?.forEach(lead => {
            if (lead.source_id) {
              sourceLeadCounts[lead.source_id] = (sourceLeadCounts[lead.source_id] || 0) + 1
            }
          })
          
          const mostProductiveSourceId = Object.entries(sourceLeadCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0]
          
          const mostProductiveSource = sources?.find(s => s.id === mostProductiveSourceId)
          
          return { data: {
            total_sources: totalSources,
            total_leads: totalLeads,
            converted_leads: convertedLeads,
            avg_conversion_rate: avgConversionRate,
            most_productive_source: mostProductiveSource?.name || 'N/A'
          } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['LeadSourceStats'],
    }),

    // 3. Individual Source Intelligence (Funnel + Trends) - Direct query
    getLeadSourceDetails: builder.query({
      queryFn: async (sourceId) => {
        try {
          // Fetch the source
          const { data: source, error: sourceError } = await supabase
            .from('lead_sources')
            .select('*')
            .eq('id', sourceId)
            .single()
          
          if (sourceError) throw sourceError
          
          // Fetch all leads for this source
          const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('status, created_at')
            .eq('source_id', sourceId)
          
          if (leadsError) throw leadsError
          
          // Calculate funnel data
          const statusCounts = {
            new: 0,
            contacted: 0,
            site_visit_done: 0,
            quotation_sent: 0,
            negotiation: 0,
            converted: 0,
            rejected: 0
          }
          
          leads?.forEach(lead => {
            if (statusCounts.hasOwnProperty(lead.status)) {
              statusCounts[lead.status]++
            }
          })
          
          return { data: {
            ...source,
            total_leads: leads?.length || 0,
            funnel: statusCounts,
            conversion_rate: leads?.length > 0 
              ? ((statusCounts.converted / leads.length) * 100).toFixed(1)
              : 0
          } }
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
