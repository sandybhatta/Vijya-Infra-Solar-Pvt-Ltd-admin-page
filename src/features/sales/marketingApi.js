import { apiSlice } from '../api/apiSlice'
import { supabase } from '@/lib/supabaseClient'

export const marketingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- CAMPAIGNS ---
    
    // 1. Get Campaigns with stats (Computes leads and conversions)
    getCampaigns: builder.query({
      queryFn: async () => {
        try {
          // Fetch campaigns and leads metrics in parallel for efficiency
          const [campaignsRes, leadsMetricsRes] = await Promise.all([
            supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
            supabase.rpc('get_campaign_performance_data') // Using NULL to get overall but we use it for per-campaign calc in JS if RPC doesn't support list
          ])

          if (campaignsRes.error) throw campaignsRes.error
          
          // Enhanced fetch: Get counts per campaign
          const { data: metrics, error: metricsError } = await supabase
            .from('leads')
            .select('campaign_id, status')
            .not('campaign_id', 'is', null)

          if (metricsError) throw metricsError

          const campaignStats = campaignsRes.data.map(campaign => {
            const campaignLeads = metrics.filter(l => l.campaign_id === campaign.id)
            const totalLeads = campaignLeads.length
            const converted = campaignLeads.filter(l => l.status === 'converted').length
            const budget = Number(campaign.budget) || 0
            
            return {
              ...campaign,
              leads_count: totalLeads,
              converted_count: converted,
              conversion_rate: totalLeads > 0 ? (converted / totalLeads) * 100 : 0,
              cpl: totalLeads > 0 ? budget / totalLeads : 0,
              cpa: converted > 0 ? budget / converted : 0,
              status: getCampaignStatus(campaign.start_date, campaign.end_date)
            }
          })

          return { data: campaignStats }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Campaigns'],
    }),

    // 2. Global KPIs
    getCampaignKPIs: builder.query({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.rpc('get_campaign_global_kpis')
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Campaigns'], // Or specific KPI tag
    }),

    // 3. Campaign Intelligence (Funnel + Trends)
    getCampaignIntelligence: builder.query({
      queryFn: async (campaignId) => {
        try {
          const { data, error } = await supabase.rpc('get_campaign_performance_data', { campaign_uuid: campaignId })
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: (result, error, id) => [{ type: 'Campaigns', id }],
    }),

    // 4. Geo Performance
    getCampaignGeoPerformance: builder.query({
        queryFn: async () => {
            try {
                const { data, error } = await supabase.rpc('get_geo_performance')
                if (error) throw error
                
                // Map renamed RPC columns back to frontend expected keys
                const mappedData = data.map(item => ({
                    city: item.p_city,
                    total_leads: item.p_total_leads,
                    converted_leads: item.p_converted_leads,
                    conversion_rate: item.p_conversion_rate,
                    top_campaign_id: item.p_top_campaign_id,
                    top_campaign_name: item.p_top_campaign_name
                }))
                
                return { data: mappedData }
            } catch (error) {
                return { error: error.message }
            }
        },
        providesTags: ['Campaigns', 'Leads']
    }),

    // 5. CRUD Operations
    createCampaign: builder.mutation({
      queryFn: async (newCampaign) => {
        try {
          const { data, error } = await supabase.from('marketing_campaigns').insert([newCampaign]).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Campaigns'],
    }),

    updateCampaign: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('marketing_campaigns').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: (result, error, { id }) => ['Campaigns', { type: 'Campaigns', id }],
    }),

    deleteCampaign: builder.mutation({
        queryFn: async (id) => {
            try {
                const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id)
                if (error) throw error
                return { data: id }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Campaigns', 'Leads']
    }),

    // Helper: Check linked leads before delete
    checkCampaignLeads: builder.query({
        queryFn: async (campaignId) => {
            const { count, error } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignId)
            if (error) return { error: error.message }
            return { data: count }
        }
    })
  }),
})

// Helper logic for campaign status
function getCampaignStatus(startDate, endDate) {
    const today = new Date().toISOString().split('T')[0]
    if (startDate > today) return 'Upcoming'
    if (endDate && endDate < today) return 'Completed'
    return 'Running'
}

export const {
  useGetCampaignsQuery,
  useGetCampaignKPIsQuery,
  useGetCampaignIntelligenceQuery,
  useGetCampaignGeoPerformanceQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useLazyCheckCampaignLeadsQuery
} = marketingApi
