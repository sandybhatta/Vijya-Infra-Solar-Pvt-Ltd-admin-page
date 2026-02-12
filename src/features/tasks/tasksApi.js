import { supabase } from '@/lib/supabaseClient'
import { apiSlice } from '../api/apiSlice'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Enhanced query with full details and filtering
    getTasksWithDetails: builder.query({
      queryFn: async ({ 
        page = 1, 
        limit = 50, 
        search = '', 
        status = '', 
        taskType = '', 
        employeeId = '', 
        leadId = '', 
        projectId = '',
        dateFrom = '',
        dateTo = '',
        onlyOverdue = false,
        onlyToday = false
      } = {}) => {
        try {
          const from = (page - 1) * limit
          const to = from + limit - 1
          
          let query = supabase
            .from('employee_tasks')
            .select(`
              *,
              employees(id, name, role, phone),
              leads(id, name, phone_number, email, city, state, status),
              projects(id, project_name, project_status, solar_type, capacity_kw)
            `, { count: 'exact' })
            .order('scheduled_date', { ascending: false })
            .range(from, to)

          // Filters
          if (status) query = query.eq('task_status', status)
          if (taskType) query = query.eq('task_type', taskType)
          if (employeeId) query = query.eq('employee_id', employeeId)
          if (leadId) query = query.eq('lead_id', leadId)
          if (projectId) query = query.eq('project_id', projectId)
          
          // Date range
          if (dateFrom) query = query.gte('scheduled_date', dateFrom)
          if (dateTo) query = query.lte('scheduled_date', dateTo)
          
          // Overdue filter
          if (onlyOverdue) {
            const today = format(new Date(), 'yyyy-MM-dd')
            query = query.lt('scheduled_date', today).eq('task_status', 'pending')
          }
          
          // Today filter
          if (onlyToday) {
            const today = format(new Date(), 'yyyy-MM-dd')
            query = query.eq('scheduled_date', today)
          }

          // Search
          if (search) {
            query = query.or(`remarks.ilike.%${search}%`)
          }

          const { data, error, count } = await query
          if (error) throw error
          
          return { data: { tasks: data || [], total: count || 0 } }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['Tasks'],
    }),

    // Analytics query for KPIs and charts
    getTasksAnalytics: builder.query({
      queryFn: async () => {
        try {
          const today = format(new Date(), 'yyyy-MM-dd')
          const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
          
          // Fetch all tasks for analytics
          const { data: allTasks, error } = await supabase
            .from('employee_tasks')
            .select(`
              *,
              employees(id, name)
            `)
          
          if (error) throw error

          // Calculate KPIs
          const total = allTasks.length
          const pending = allTasks.filter(t => t.task_status === 'pending').length
          const done = allTasks.filter(t => t.task_status === 'done').length
          const cancelled = allTasks.filter(t => t.task_status === 'cancelled').length
          const overdue = allTasks.filter(t => 
            t.task_status === 'pending' && t.scheduled_date < today
          ).length
          const dueToday = allTasks.filter(t => t.scheduled_date === today).length
          const dueThisWeek = allTasks.filter(t => 
            t.scheduled_date >= today && t.scheduled_date <= format(subDays(new Date(), -7), 'yyyy-MM-dd')
          ).length
          const completionRate = total > 0 ? ((done / total) * 100).toFixed(1) : 0

          // Task type distribution
          const typeDistribution = allTasks.reduce((acc, task) => {
            acc[task.task_type] = (acc[task.task_type] || 0) + 1
            return acc
          }, {})

          // Employee productivity
          const employeeStats = {}
          allTasks.forEach(task => {
            if (task.employees) {
              const empId = task.employee_id
              if (!employeeStats[empId]) {
                employeeStats[empId] = {
                  name: task.employees.name,
                  total: 0,
                  completed: 0,
                  pending: 0
                }
              }
              employeeStats[empId].total++
              if (task.task_status === 'done') employeeStats[empId].completed++
              if (task.task_status === 'pending') employeeStats[empId].pending++
            }
          })

          return {
            data: {
              kpis: {
                total,
                pending,
                done,
                cancelled,
                overdue,
                dueToday,
                dueThisWeek,
                completionRate
              },
              typeDistribution,
              employeeStats: Object.values(employeeStats),
              tasks: allTasks
            }
          }
        } catch (error) {
          return { error: error.message }
        }
      },
      providesTags: ['TasksAnalytics'],
    }),

    // Create task with notification
    createTask: builder.mutation({
      queryFn: async (taskData) => {
        try {
          // Validate: cannot have both lead_id and project_id
          if (taskData.lead_id && taskData.project_id) {
            throw new Error('Cannot link both lead and project')
          }

          // Auto-set completed_date if status is done
          if (taskData.task_status === 'done' && !taskData.completed_date) {
            taskData.completed_date = format(new Date(), 'yyyy-MM-dd')
          }

          // Insert task
          const { data: task, error: taskError } = await supabase
            .from('employee_tasks')
            .insert([taskData])
            .select(`
              *,
              employees(name)
            `)
            .single()
          
          if (taskError) throw taskError

          // Create notification
          await supabase.from('notifications').insert([{
            title: 'New Task Assigned',
            message: `${taskData.task_type} task assigned to ${task.employees?.name || 'employee'}`,
            type: 'task',
            is_read: false
          }])

          return { data: task }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'TasksAnalytics', 'Dashboard'],
    }),

    // Update task
    updateTask: builder.mutation({
      queryFn: async ({ id, ...updates }) => {
        try {
          // Handle status change logic
          if (updates.task_status === 'done' && !updates.completed_date) {
            updates.completed_date = format(new Date(), 'yyyy-MM-dd')
          } else if (updates.task_status === 'pending' && updates.completed_date) {
            updates.completed_date = null
          }

          const { data, error } = await supabase
            .from('employee_tasks')
            .update(updates)
            .eq('id', id)
            .select(`
              *,
              employees(name, role, phone),
              leads(name, phone_number, email),
              projects(project_name, project_status)
            `)
            .single()
          
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'TasksAnalytics', 'Dashboard'],
    }),

    // Bulk update tasks
    bulkUpdateTasks: builder.mutation({
      queryFn: async ({ ids, updates }) => {
        try {
          // Handle status change logic for bulk
          if (updates.task_status === 'done' && !updates.completed_date) {
            updates.completed_date = format(new Date(), 'yyyy-MM-dd')
          } else if (updates.task_status === 'pending') {
            updates.completed_date = null
          }

          const { data, error } = await supabase
            .from('employee_tasks')
            .update(updates)
            .in('id', ids)
            .select()
          
          if (error) throw error
          return { data }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'TasksAnalytics', 'Dashboard'],
    }),

    // Delete task
    deleteTask: builder.mutation({
      queryFn: async (id) => {
        try {
          const { error } = await supabase
            .from('employee_tasks')
            .delete()
            .eq('id', id)
          
          if (error) throw error
          return { data: id }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'TasksAnalytics', 'Dashboard'],
    }),

    // Bulk delete tasks
    bulkDeleteTasks: builder.mutation({
      queryFn: async (ids) => {
        try {
          const { error } = await supabase
            .from('employee_tasks')
            .delete()
            .in('id', ids)
          
          if (error) throw error
          return { data: ids }
        } catch (error) {
          return { error: error.message }
        }
      },
      invalidatesTags: ['Tasks', 'TasksAnalytics', 'Dashboard'],
    }),
  }),
})

export const {
  useGetTasksWithDetailsQuery,
  useGetTasksAnalyticsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useBulkUpdateTasksMutation,
  useDeleteTaskMutation,
  useBulkDeleteTasksMutation,
} = tasksApi
