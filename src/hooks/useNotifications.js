import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch notifications with filters and pagination
 */
async function fetchNotifications({ 
  page = 1, 
  limit = 25,
  search = '',
  type = '',
  readStatus = 'all', // 'all', 'read', 'unread'
  dateFrom = '',
  dateTo = '',
  sortBy = 'newest' // 'newest', 'oldest', 'unread'
}) {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (readStatus === 'read') {
      query = query.eq('is_read', true)
    } else if (readStatus === 'unread') {
      query = query.eq('is_read', false)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'unread':
        query = query.order('is_read', { ascending: true }).order('created_at', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
    }

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      notifications: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

/**
 * Fetch notification analytics and KPIs
 */
async function fetchNotificationAnalytics() {
  try {
    const now = new Date()
    const todayStart = startOfDay(now).toISOString()
    const weekStart = subDays(now, 7).toISOString()
    const monthStart = subDays(now, 30).toISOString()

    // Fetch all notifications for analytics
    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const notifications = allNotifications || []

    // Calculate KPIs
    const totalToday = notifications.filter(n => n.created_at >= todayStart).length
    const totalWeek = notifications.filter(n => n.created_at >= weekStart).length
    const totalMonth = notifications.filter(n => n.created_at >= monthStart).length
    const unreadCount = notifications.filter(n => !n.is_read).length

    // Most frequent type
    const typeCounts = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, {})
    const mostFrequentType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    // Last notification time
    const lastNotification = notifications[0]?.created_at || null

    // Chart data: Notifications per day (last 30 days)
    const dailyData = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const count = notifications.filter(n => 
        format(new Date(n.created_at), 'yyyy-MM-dd') === dateStr
      ).length
      dailyData.push({
        date: format(date, 'MMM dd'),
        count
      })
    }

    // Chart data: Type distribution
    const typeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / notifications.length) * 100).toFixed(1)
    }))

    // Chart data: Read vs Unread over time (last 30 days)
    const readUnreadData = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayNotifications = notifications.filter(n => 
        format(new Date(n.created_at), 'yyyy-MM-dd') === dateStr
      )
      readUnreadData.push({
        date: format(date, 'MMM dd'),
        read: dayNotifications.filter(n => n.is_read).length,
        unread: dayNotifications.filter(n => !n.is_read).length
      })
    }

    return {
      kpis: {
        totalToday,
        totalWeek,
        totalMonth,
        unreadCount,
        mostFrequentType,
        lastNotification
      },
      charts: {
        dailyData,
        typeDistribution,
        readUnreadData
      }
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    throw error
  }
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch notifications with filters
 */
export function useNotifications(filters = {}) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => fetchNotifications(filters),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch notification analytics
 */
export function useNotificationAnalytics() {
  return useQuery({
    queryKey: ['notification-analytics'],
    queryFn: fetchNotificationAnalytics,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to mark notification(s) as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      const idArray = Array.isArray(ids) ? ids : [ids]
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', idArray)

      if (error) throw error
      return idArray
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-analytics'] })
      toast.success('Marked as read')
    },
    onError: (error) => {
      console.error('Error marking as read:', error)
      toast.error('Failed to mark as read')
    }
  })
}

/**
 * Hook to mark notification(s) as unread
 */
export function useMarkAsUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      const idArray = Array.isArray(ids) ? ids : [ids]
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .in('id', idArray)

      if (error) throw error
      return idArray
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-analytics'] })
      toast.success('Marked as unread')
    },
    onError: (error) => {
      console.error('Error marking as unread:', error)
      toast.error('Failed to mark as unread')
    }
  })
}

/**
 * Hook to delete notification(s)
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      const idArray = Array.isArray(ids) ? ids : [ids]
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', idArray)

      if (error) throw error
      return idArray
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-analytics'] })
      toast.success('Notification(s) deleted')
    },
    onError: (error) => {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  })
}

/**
 * Hook for realtime notifications subscription
 */
export function useNotificationRealtime(enabled = false) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          toast.success('New notification received!', {
            icon: '🔔'
          })
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notification-analytics'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notification-analytics'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notification-analytics'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
