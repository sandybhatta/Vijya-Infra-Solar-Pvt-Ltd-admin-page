import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { supabase } from '@/lib/supabaseClient'
import { setUser } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import toast, { Toaster } from 'react-hot-toast'
import { Loader2, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.session) {
        // Check if user is an admin or manager
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (adminError || !adminUser) {
           await supabase.auth.signOut()
           toast.error("Access Denied: You are not a registered system user.")
        } else if (!adminUser.is_active) {
           await supabase.auth.signOut()
           toast.error("Account Pending: Wait till the admin verifies you.")
        } else {
           dispatch(setUser({ 
               user: data.user, 
               session: data.session, 
               role: adminUser.role 
           }))
           toast.success("Welcome back, Commander.")
           navigate('/dashboard')
        }
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-blue/20 rounded-full blur-[100px] animate-pulse-glow delay-1000" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md px-4"
      >
        <Card className="border-glass-border bg-glass-bg backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <Sun className="h-8 w-8 text-neon-blue" />
                </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Solar Admin Command</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access the mainframe
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@solar.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black/20 border-white/10 focus:border-neon-blue focus:ring-neon-blue/50 text-white placeholder:text-gray-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/20 border-white/10 focus:border-neon-blue focus:ring-neon-blue/50 text-white"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-bold shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-all hover:scale-[1.02]" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Initiate Sequence"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
      <Toaster position="bottom-center" toastOptions={{
          style: {
              background: '#333',
              color: '#fff',
              border: '1px solid #444'
          }
      }}/>
    </div>
  )
}
