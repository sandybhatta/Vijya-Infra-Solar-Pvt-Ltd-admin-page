import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'

export const hrApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      queryFn: async ({ page = 1, limit = 10, search = '' } = {}) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          let query = supabase
            .from('employees')
            .select('*', { count: 'exact' })
            .order('name', { ascending: true })
            .range(from, to)

          if (search) {
             query = query.ilike('name', `%${search}%`)
          }

          const { data, error, count } = await query
          if (error) throw error
          return { data: { employees: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Employees'],
    }),
    addEmployee: builder.mutation({
      queryFn: async (newEmployee) => {
        try {
          const { data, error } = await supabase.from('employees').insert([newEmployee]).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Employees'],
    }),
    updateEmployee: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Employees'],
    }),
    deleteEmployee: builder.mutation({
        queryFn: async (id) => {
            try {
                const { error } = await supabase.from('employees').delete().eq('id', id)
                if (error) throw error
                return { data: id }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Employees']
    }),

    // --- TASKS ---
    getTasks: builder.query({
      queryFn: async ({ page = 1, limit = 10, employee_id = '' }) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          let query = supabase
            .from('employee_tasks')
            .select('*, employees(name), projects(id, leads(name))', { count: 'exact' })
            .order('scheduled_date', { ascending: true })
            .range(from, to)

          if (employee_id) {
             query = query.eq('employee_id', employee_id)
          }

          const { data, error, count } = await query
          if (error) throw error
          return { data: { tasks: data, total: count } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Tasks'],
    }),
    addTask: builder.mutation({
      queryFn: async (newTask) => {
        try {
          const { data, error } = await supabase.from('employee_tasks').insert([newTask]).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'Dashboard'],
    }),
    updateTask: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          const { data, error } = await supabase.from('employee_tasks').update(updates).eq('id', id).select()
          if (error) throw error
          return { data: data[0] }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'Dashboard'],
    }),
    deleteTask: builder.mutation({
        queryFn: async (id) => {
            try {
                const { error } = await supabase.from('employee_tasks').delete().eq('id', id)
                if (error) throw error
                return { data: id }
            } catch (error) {
                return { error: error.message }
            }
        },
        invalidatesTags: ['Tasks', 'Dashboard']
    })
  }),
})

export const { 
    useGetEmployeesQuery, 
    useAddEmployeeMutation, 
    useUpdateEmployeeMutation, 
    useDeleteEmployeeMutation,
    useGetTasksQuery,
    useAddTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation
} = hrApi
