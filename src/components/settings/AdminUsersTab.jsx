import React, { useState } from 'react'
import { useAdminUsers, useAdminUserMutations } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Shield, 
    Plus, 
    Trash2, 
    UserCog, 
    MoreVertical, 
    UserPlus, 
    Mail, 
    ShieldCheck, 
    ShieldAlert,
    Loader2,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'

const adminSchema = z.object({
    email: z.string().email("Invalid email"),
    role: z.enum(['admin', 'manager']),
})

export function AdminUsersTab() {
    const { data: admins, isLoading } = useAdminUsers()
    const { createAdmin, updateAdmin, deleteAdmin } = useAdminUserMutations()
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(null) // Stores admin object
    
    const [currentUser, setCurrentUser] = useState(null)
    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    }, [])

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(adminSchema),
        defaultValues: {
            role: 'manager'
        }
    })


    const handleRoleChange = async (admin, newRole) => {
        try {
            await updateAdmin.mutateAsync({ id: admin.id, role: newRole })
            toast.success(`Role updated to ${newRole}`)
        } catch (error) {
            toast.error("Failed to update role")
        }
    }

    const handleDelete = async () => {
        if (!isDeleteModalOpen) return
        try {
            await deleteAdmin.mutateAsync(isDeleteModalOpen.id)
            toast.success("Admin access revoked")
            setIsDeleteModalOpen(null)
        } catch (error) {
            toast.error("Failed to revoke access")
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neon-blue" /></div>

    return (
        <div className="space-y-6">
            {/* Current User Info */}
            <Card className="bg-neon-blue/5 border-neon-blue/20 backdrop-blur-md">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-neon-blue/10 flex items-center justify-center border border-neon-blue/30">
                            <ShieldCheck className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Logged in As</p>
                            <p className="text-sm font-bold text-white">{currentUser?.email}</p>
                        </div>
                    </div>
                    <Badge className="bg-neon-blue text-black font-black uppercase">Current Session</Badge>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-white/[0.02] gap-4 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                            <Shield className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-white uppercase italic tracking-tighter">System Administrators</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs">Manage access levels and security protocols.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[600px] md:min-w-full">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest p-4">Admin Identity</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest">Access Level</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-center">Status</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest">Joined</TableHead>
                                    <TableHead className="text-right p-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins?.map((admin) => (
                                    <TableRow key={admin.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue font-black text-xs shrink-0">
                                                    {admin.full_name?.charAt(0) || 'A'}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-white uppercase italic tracking-tight truncate">{admin.full_name || 'Awaiting Signup...'}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium truncate">{admin.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`capitalize font-black border-none text-[9px] tracking-widest ${
                                                admin.role === 'admin' ? 'bg-neon-blue/10 text-neon-blue' : 'bg-violet-500/10 text-violet-400'
                                            }`}>
                                                {admin.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {admin.is_active ? (
                                                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5 text-red-400 text-[10px] font-black uppercase tracking-tighter">
                                                    <XCircle className="h-3 w-3" /> Offline
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-[10px] font-mono whitespace-nowrap">
                                            {new Date(admin.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right p-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-gray-300">
                                                    <DropdownMenuItem 
                                                        onClick={() => handleRoleChange(admin, admin.role === 'admin' ? 'manager' : 'admin')}
                                                        className="gap-2 focus:bg-white/5 focus:text-white text-xs font-bold"
                                                    >
                                                        <ShieldAlert className="h-4 w-4" /> {admin.role === 'admin' ? 'Downgrade to Manager' : 'Upgrade to Admin'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem 
                                                        onClick={() => setIsDeleteModalOpen(admin)}
                                                        className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 text-xs font-bold"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Revoke Access
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>


            {/* Delete Confirmation Modal */}
            <Dialog open={!!isDeleteModalOpen} onOpenChange={() => setIsDeleteModalOpen(null)}>
                <DialogContent className="bg-slate-950 border-red-500/20 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-400">Revoke Admin Access?</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            This will immediately clear all administrative permissions for <span className="text-white font-bold">{isDeleteModalOpen?.email}</span>.
                            They will no longer be able to access the admin panel.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(null)}>Cancel</Button>
                        <Button onClick={handleDelete} disabled={deleteAdmin.isPending} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                            {deleteAdmin.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Revoke Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
