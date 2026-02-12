import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '@/lib/supabaseClient'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Dummy base URL, we use Supabase SDK
  tagTypes: ['Leads', 'Projects', 'Invoices', 'Payments', 'Expenses', 'Inventory', 'Admins', 'Notifications', 'Users', 'LeadSources', 'LeadSourceStats', 'Campaigns', 'Sources'],
  endpoints: (builder) => ({}),
})
