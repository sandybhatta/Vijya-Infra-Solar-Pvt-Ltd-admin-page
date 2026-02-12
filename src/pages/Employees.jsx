import React, { useState } from 'react'
import { useGetEmployeesQuery, useAddEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation } from '@/features/hr/hrApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, User, Mail, Phone, Briefcase, Trash2, Edit, MoreHorizontal, Shield } from 'lucide-react'
import { useSelector } from 'react-redux' // Added
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import toast from 'react-hot-toast'

const EmployeeModal = ({ open, setOpen, initialData = null }) => {
    const [addEmployee] = useAddEmployeeMutation()
    const [updateEmployee] = useUpdateEmployeeMutation()
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'Technician', status: 'active' })

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData)
        } else {
            setFormData({ name: '', email: '', phone: '', role: 'Technician', status: 'active' })
        }
    }, [initialData, open])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (initialData) {
                await updateEmployee({ id: initialData.id, ...formData }).unwrap()
                toast.success("Employee updated")
            } else {
                await addEmployee(formData).unwrap()
                toast.success("Employee added")
            }
            setOpen(false)
        } catch (error) {
            toast.error("Operation failed")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
             <DialogContent className="bg-glass-bg border-glass-border">
                <DialogHeader>
                    <DialogTitle className="text-white">{initialData ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                     <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                     <div className="grid gap-2">
                        <Label>Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                    </div>
                     <div className="grid gap-2">
                        <Label>Role</Label>
                        <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-white/5 border-white/10 text-white" placeholder="e.g. Technician, Sales, Manager" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="bg-neon-blue text-black font-bold">Save Record</Button>
                    </DialogFooter>
                </form>
             </DialogContent>
        </Dialog>
    )
}

export default function Employees() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const { data, isLoading } = useGetEmployeesQuery({ page, limit: 20, search })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [deleteEmployee] = useDeleteEmployeeMutation()
    const { role } = useSelector((state) => state.auth) // Get role

    const handleDelete = async (id) => {
        if(confirm("Remove this employee?")) {
            await deleteEmployee(id)
            toast.success("Employee removed")
        }
    }

    const columns = [
        {
            accessorKey: 'name',
            header: 'Employee',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.original.email}`} />
                        <AvatarFallback>Ei</AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-white">{row.getValue('name')}</div>
                </div>
            )
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10 flex w-fit items-center gap-1">
                    <Briefcase className="h-3 w-3"/> {row.getValue('role')}
                </Badge>
            )
        },
        {
            id: 'contact',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs text-gray-400">
                     <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {row.original.email}</span>
                     <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {row.original.phone}</span>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                 <Badge className={row.getValue('status') === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                     {row.getValue('status')}
                 </Badge>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                     {role === 'admin' && (
                        <>
                             <Button variant="ghost" size="icon" onClick={() => { setEditingItem(row.original); setIsModalOpen(true) }}><Edit className="h-4 w-4 text-blue-400"/></Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}><Trash2 className="h-4 w-4 text-red-400"/></Button>
                        </>
                     )}
                </div>
            )
        }
    ]

    return (
        <div className="space-y-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Employees</h1>
                     <p className="text-gray-400">Manage team members and roles.</p>
                </div>
                {role === 'admin' && (
                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="bg-neon-blue text-black hover:bg-neon-blue/80 font-bold">
                        <Plus className="mr-2 h-4 w-4" /> Add Employee
                    </Button>
                )}
            </div>

            <div className="bg-glass-bg rounded-xl border border-glass-border overflow-hidden p-1">
                 {isLoading ? <div className="p-10 text-center text-neon-blue animate-pulse">Scanning Personnel...</div> : (
                     <DataTable 
                        searchKey="name"
                        columns={columns} 
                        data={data?.employees || []} 
                        pageCount={Math.ceil((data?.total || 0) / 20)}
                     /> 
                 )}
            </div>
            
            <EmployeeModal open={isModalOpen} setOpen={setIsModalOpen} initialData={editingItem} />
        </div>
    )
}
