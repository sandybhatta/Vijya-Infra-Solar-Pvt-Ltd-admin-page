import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'
import { format } from 'date-fns'

/**
 * Hook to manage Employees data
 */
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

/**
 * Hook to manage Employee Tasks data with joins
 */
export const useEmployeeTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['employee_tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('employee_tasks')
        .select(`
          *,
          employees(id, name, role, phone),
          leads(id, name, phone_number, city, state, status),
          projects(id, project_name, project_status, capacity_kw)
        `)
        .order('scheduled_date', { ascending: false })

      if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
      if (filters.status) query = query.eq('task_status', filters.status)
      if (filters.type) query = query.eq('task_type', filters.type)
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

/**
 * Hook for Leads and Projects (Lookup data)
 */
export const useLookups = () => {
  const leads = useQuery({
    queryKey: ['leads-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    }
  })

  const projects = useQuery({
    queryKey: ['projects-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name')
        .order('project_name')
      if (error) throw error
      return data
    }
  })

  return { leads, projects }
}

/**
 * Mutations for Employees
 */
export const useEmployeeMutations = () => {
  const queryClient = useQueryClient()

  const createEmployee = useMutation({
    mutationFn: async (newEmployee) => {
      const { data, error } = await supabase.from('employees').insert([newEmployee]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  })

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  })

  const deleteEmployee = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  })

  return { createEmployee, updateEmployee, deleteEmployee }
}

/**
 * Mutations for Tasks
 */
export const useTaskMutations = () => {
  const queryClient = useQueryClient()

  const createTask = useMutation({
    mutationFn: async (newTask) => {
      const { data, error } = await supabase.from('employee_tasks').insert([newTask]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee_tasks'] })
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Auto-set completed_date if status is done
      if (updates.task_status === 'done' && !updates.completed_date) {
        updates.completed_date = format(new Date(), 'yyyy-MM-dd')
      } else if (updates.task_status === 'pending') {
        updates.completed_date = null
      }

      const { data, error } = await supabase.from('employee_tasks').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee_tasks'] })
  })

  const deleteTask = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('employee_tasks').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee_tasks'] })
  })

  return { createTask, updateTask, deleteTask }
}

/**
 * Real-time Subscription Hook
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const employeesSub = supabase
      .channel('employees-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] })
      })
      .subscribe()

    const tasksSub = supabase
      .channel('tasks-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['employee_tasks'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(employeesSub)
      supabase.removeChannel(tasksSub)
    }
  }, [queryClient])
}
