import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { Shield, Plus } from 'lucide-react'

// WARNING: Creating new admins usually requires proper Auth API interaction (signUp) 
// or inviting them. For simplicity, we just add to the 'admin_users' table here,
// assuming the user already exists in auth. 
// OR better: we use a cloud function.
// For this demo, let's assume we just insert into admin_users and invite via email is manual/handled later.

export default function Admins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAdmins = async () => {
      setLoading(true)
      const { data } = await supabase.from('admin_users').select('*')
      if (data) setAdmins(data)
      setLoading(false)
  }

  useEffect(() => {
      fetchAdmins()

      // Subscribe to real-time changes
      const channel = supabase
        .channel('admin_users_changes')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'admin_users' 
        }, () => {
            fetchAdmins()
        })
        .subscribe()

      return () => {
          supabase.removeChannel(channel)
      }
  }, [])
  
  // Real implementation needs an Edge Function to: supabase.auth.admin.inviteUserByEmail(...)

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Users & Access List</h1>
            <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={fetchAdmins} className="text-gray-400 border-white/10 hover:bg-white/5">Refresh</Button>
            </div>
        </div>

        <div className="rounded-md border border-glass-border bg-glass-bg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-300">Name / Email</TableHead>
                        <TableHead className="text-gray-300">Role</TableHead>
                        <TableHead className="text-gray-300">Verified</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Access</TableHead>
                        <TableHead className="text-gray-300">Added On</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {admins.map((admin) => (
                        <TableRow key={admin.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="font-medium text-white">
                                <div>{admin.full_name || 'Awaiting Signup...'}</div>
                                <div className="text-xs text-gray-400 font-normal">{admin.email}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-neon-blue" />
                                    <span className="capitalize text-gray-300">{admin.role || 'Admin'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {admin.is_confirmed ? (
                                    <span className="text-green-400 text-xs">Yes</span>
                                ) : (
                                    <span className="text-red-400 text-xs">No</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {admin.user_id && !admin.is_active ? (
                                    <span className="text-neon-blue text-xs px-2 py-1 rounded bg-neon-blue/10 border border-neon-blue/20 animate-pulse font-bold">Ready for Approval</span>
                                ) : admin.user_id ? (
                                    <span className="text-green-400 text-xs px-2 py-1 rounded bg-green-400/10 border border-green-400/20">Active/Linked</span>
                                ) : (
                                    <span className="text-yellow-400 text-xs px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/20">Pending Signup</span>
                                )}
                            </TableCell>
                            <TableCell className="text-gray-400">{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Button 
                                    variant={admin.is_active ? "destructive" : "outline"}
                                    size="sm"
                                    className={admin.is_active ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white" : "border-gray-500/20 text-gray-400 hover:bg-white/5"}
                                    onClick={async () => {
                                        const { error } = await supabase
                                            .from('admin_users')
                                            .update({ is_active: !admin.is_active })
                                            .eq('id', admin.id)
                                        
                                        if (error) toast.error(error.message)
                                        else {
                                            toast.success(admin.is_active ? "Access Revoked" : "Account Verified")
                                            fetchAdmins()
                                        }
                                    }}
                                >
                                    {!admin.is_active && admin.user_id ? "Verify" : admin.is_active ? "Revoke" : "Enable"}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {admins.length === 0 && !loading && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-gray-500">No admins found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  )
}
