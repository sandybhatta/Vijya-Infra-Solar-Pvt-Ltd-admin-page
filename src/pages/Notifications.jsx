import React from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

export default function Notifications() {
  const [notifications, setNotifications] = React.useState([])

  React.useEffect(() => {
    // Initial fetch
    const fetchNotifications = async () => {
        const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
        if (data) setNotifications(data)
    }
    fetchNotifications()

    // Realtime subscription
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  return (
    <div className="space-y-4">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
                {notifications.length === 0 ? <p>No notifications.</p> : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500 mr-2" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{notif.title}</p>
                                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  )
}
