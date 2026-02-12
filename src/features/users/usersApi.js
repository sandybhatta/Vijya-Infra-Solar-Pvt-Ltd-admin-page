import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'
import { toast } from 'react-hot-toast'

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      queryFn: async ({ page = 1, limit = 10, search = '', solarType = '' }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          
          let query = supabase
            .from('Users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

          if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`)
          }
          if (solarType && solarType !== 'all') {
            query = query.eq('solar_type', solarType)
          }

          const { data, error, count } = await query
          if (error) throw error
          
          return { data: { users: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Users'],
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        // Only subscribe to realtime updates if we are on the first page and no search/filter
        // Or just subscribe and prepend if it matches?
        // Simpler to just subscribe and invalidate or update.
        // For the main list, invalidation is safer to keep pagination correct.
        // But for "Latest Enquiries" dashboard widget, we want instant append.
        
        try {
          await cacheDataLoaded
          
          const channel = supabase
            .channel('users-list-realtime')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'Users' },
              (payload) => {
                updateCachedData((draft) => {
                  // If we are looking at the latest data (page 1, no filters or matching filters)
                  // It's complex to match filters on client side perfectly.
                  // For now, simple prepend if page 1.
                  if (arg.page === 1 && !arg.search && !arg.solarType) {
                      draft.users.unshift(payload.new)
                      draft.total += 1
                      // Keep limit?
                      if (draft.users.length > arg.limit) {
                          draft.users.pop()
                      }
                  }
                })
              }
            )
            .subscribe()

          await cacheEntryRemoved
          supabase.removeChannel(channel)
        } catch (error) {
          // no-op
        }
      },
    }),
    getLatestUsers: builder.query({
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('Users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

          if (error) throw error
          return { data: { users: data } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Users'],
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        try {
          await cacheDataLoaded
          
          const channel = supabase
            .channel('users-latest-realtime')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'Users' },
              (payload) => {
                toast.success('New enquiry received!')
                
                updateCachedData((draft) => {
                  draft.users.unshift(payload.new)
                  if (draft.users.length > 10) {
                    draft.users.pop()
                  }
                })
              }
            )
            .subscribe()

          await cacheEntryRemoved
          supabase.removeChannel(channel)
        } catch (error) {
          // no-op
        }
      }
    }),
    deleteUser: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase.from('Users').delete().eq('id', id)
          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Users'],
    }),
  }),
})

export const { 
  useGetUsersQuery, 
  useGetLatestUsersQuery, 
  useDeleteUserMutation
} = usersApi
