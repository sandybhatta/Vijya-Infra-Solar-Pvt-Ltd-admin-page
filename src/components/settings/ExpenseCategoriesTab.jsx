import React, { useState } from 'react'
import { useExpenseCategories, useExpenseCategoryMutations } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Wallet, 
    Plus, 
    Trash2, 
    Edit, 
    MoreVertical, 
    Loader2,
    DollarSign,
    TrendingUp,
    Save
} from 'lucide-react'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'

const categorySchema = z.object({
    name: z.string().min(2, "Category name is required"),
})

export function ExpenseCategoriesTab() {
    const { data: categories, isLoading } = useExpenseCategories()
    const { createCategory, updateCategory, deleteCategory } = useExpenseCategoryMutations()
    const [modalState, setModalState] = useState({ open: false, mode: 'add', data: null })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(categorySchema)
    })

    const onAddEdit = (mode, data = null) => {
        setModalState({ open: true, mode, data })
        reset({ name: data?.name || '' })
    }

    const onSubmit = async (formData) => {
        try {
            if (modalState.mode === 'add') {
                await createCategory.mutateAsync(formData)
                toast.success("Category added")
            } else {
                await updateCategory.mutateAsync({ id: modalState.data.id, ...formData })
                toast.success("Category updated")
            }
            setModalState({ open: false, mode: 'add', data: null })
        } catch (error) {
            toast.error("Process failed")
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return
        try {
            await deleteCategory.mutateAsync(deleteConfirm.id)
            toast.success("Category removed")
            setDeleteConfirm(null)
        } catch (error) {
            toast.error(error.message || "Failed to remove category")
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neon-blue" /></div>

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-white/[0.02] gap-4 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <Wallet className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-white uppercase italic tracking-tighter">Expenditure Protocol</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs">Manage budget buckets for business flow.</CardDescription>
                        </div>
                    </div>
                    <Button onClick={() => onAddEdit('add')} className="w-full sm:w-auto bg-neon-blue text-black hover:bg-neon-blue/80 font-bold uppercase text-xs tracking-widest h-10">
                        <Plus className="h-4 w-4 mr-2" /> Add Category
                    </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[500px] md:min-w-full">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest p-4">Category Descriptor</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-center">Frequency</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-right">Total Burn</TableHead>
                                    <TableHead className="text-right p-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories?.map((cat) => (
                                    <TableRow key={cat.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="p-4 font-bold text-white uppercase italic tracking-tight">
                                            {cat.name}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-gray-400 text-[10px]">
                                            {cat.total_expenses} OPS.
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10 font-mono text-[10px] px-2">
                                                {formatCurrency(cat.total_amount)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right p-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-gray-300 font-bold">
                                                    <DropdownMenuItem onClick={() => onAddEdit('edit', cat)} className="gap-2 focus:bg-white/5 focus:text-white text-xs">
                                                        <Edit className="h-4 w-4" /> Edit Category
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => setDeleteConfirm(cat)}
                                                        className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 text-xs"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Terminate
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

            {/* Add/Edit Modal */}
            <Dialog open={modalState.open} onOpenChange={(v) => !v && setModalState({ ...modalState, open: false })}>
                <DialogContent className="bg-slate-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {modalState.mode === 'add' ? 'New Expense Category' : 'Edit Category'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input 
                                {...register('name')}
                                className="bg-white/5 border-white/10 text-white italic font-bold" 
                                placeholder="Inventory / Marketing / Travel"
                            />
                            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                        </div>
                        <DialogFooter className="pt-4">
                            <Button variant="ghost" type="button" onClick={() => setModalState({ ...modalState, open: false })}>Cancel</Button>
                            <Button type="submit" className="bg-neon-blue text-black font-bold">
                                {modalState.mode === 'add' ? <Plus className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {modalState.mode === 'add' ? 'Add Category' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="bg-slate-950 border-red-500/20 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-400 font-black tracking-tighter">ORPHAN ALERT</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm italic font-bold">
                            Deleting category <span className="text-white">"{deleteConfirm?.name}"</span> will leave {deleteConfirm?.total_expenses} expense records WITHOUT a category. 
                            <br/><br/>
                            Total affected burn value: <span className="text-red-400">{formatCurrency(deleteConfirm?.total_amount)}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                            Execute Deletion
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
