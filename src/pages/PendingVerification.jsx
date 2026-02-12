import React from 'react'
import { Button } from '@/components/ui/button'
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useDispatch } from 'react-redux'
import { clearUser } from '@/features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

export function PendingVerification() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [checking, setChecking] = React.useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    dispatch(clearUser())
    navigate('/login')
  }

  const handleCheckStatus = () => {
    setChecking(true)
    // Reloading the page will trigger ProtectedRoute to re-fetch status
    window.location.reload()
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="z-10 max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 animate-pulse">
                    <ShieldAlert className="h-10 w-10 text-yellow-500" />
                </div>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Verification Pending</h1>
                <p className="text-gray-400">
                    Your account has been created but requires administrator approval before you can access the system.
                </p>
            </div>

            <div className="p-4 rounded-lg bg-black/40 border border-white/5 text-sm text-gray-400">
                <p>Please contact the main administrator to verify your account.</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button 
                    onClick={handleCheckStatus} 
                    className="w-full bg-neon-blue text-black hover:bg-neon-blue/80"
                    disabled={checking}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? 'Checking...' : 'Check Status'}
                </Button>
                
                <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full border-white/10 hover:bg-white/5 text-gray-400"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    </div>
  )
}
