import { apiSlice } from '../api/apiSlice'
import { supabase } from '@/lib/supabaseClient'
import { financeApi } from './financeApi' // Added import

export const quotationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query({
      queryFn: async ({ page = 1, limit = 10, filters = {} }) => {
        try {
          let query = supabase
            .from('quotations')
            .select('*, leads(name, email)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

          if (filters.status) query = query.eq('quotation_status', filters.status)

          const { data, error, count } = await query
          if (error) throw error
          return { data: { quotations: data, total: count } }
        } catch (error) {
          return { error }
        }
      },
      providesTags: ['Quotations'],
    }),
    createQuotation: builder.mutation({
      queryFn: async (newQuotation) => {
        try {
          const { data, error } = await supabase.from('quotations').insert(newQuotation).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error }
        }
      },
      invalidatesTags: ['Quotations'],
    }),
    updateQuotation: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('quotations').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error }
        }
      },
      invalidatesTags: ['Quotations'],
    }),
    deleteQuotation: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase.from('quotations').delete().eq('id', id)
          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error }
        }
      },
      invalidatesTags: ['Quotations'],
    }),
  }),
})

export const {
  useGetQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
} = quotationsApi

export const { useGetBusinessSettingsQuery } = financeApi // Re-export from financeApi
