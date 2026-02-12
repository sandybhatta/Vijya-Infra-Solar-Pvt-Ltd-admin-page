import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { supabase } from '@/lib/supabaseClient'
import { setUser, clearUser, setLoading } from '@/features/auth/authSlice'
import { Loader2 } from 'lucide-react'

import { PendingVerification } from '@/pages/PendingVerification'

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading, isActive } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Fetch user role from 'admin_users' table
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('role, is_active')
          .eq('user_id', session.user.id)
          .single()
        
        if (adminUser) {
             dispatch(setUser({ 
                 user: session.user, 
                 session, 
                 role: adminUser.role,
                 isActive: adminUser.is_active
             }))
        } else {
            // Valid Supabase session but NOT in admin_users table -> Access Denied
            await supabase.auth.signOut()
            dispatch(clearUser())
        }
      } else {
        dispatch(clearUser())
      }
    }
    
    // Only check if we are in initial loading state
    if (loading) {
        checkSession()
    }
  }, [dispatch, loading])

  if (loading) {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">
            <Loader2 className="h-10 w-10 animate-spin text-neon-blue" />
        </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user is active (Verified by admin)
  if (!isActive) {
      return <PendingVerification />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
     // User is auth but doesn't have permission (e.g. Manager trying to access Admin page)
     return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
