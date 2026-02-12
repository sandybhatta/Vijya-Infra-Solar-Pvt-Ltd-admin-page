import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useDeleteProjectMutation } from '@/features/projects/projectsApi'
import toast from 'react-hot-toast'

export default function DeleteProjectModal({ open, setOpen, project }) {
  const [confirmName, setConfirmName] = useState('')
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation()

  const invoicesCount = project?.invoices?.length || 0
  const expensesCount = project?.expenses?.length || 0
  const tasksCount = project?.tasks?.length || 0

  const handleDelete = async () => {
    if (confirmName !== project?.project_name) return
    
    try {
      await deleteProject(project.id).unwrap()
      toast.success("Project and related records purged.")
      setOpen(false)
      setConfirmName('')
    } catch (error) {
      toast.error(error.message || "Deletion failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-black/95 border-red-500/20 text-white backdrop-blur-2xl sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-500/10 text-red-500">
               <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-red-500 uppercase tracking-tighter">
              Critical Action
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 font-medium">
            You are about to permanently delete <span className="text-white font-bold">"{project?.project_name}"</span>. 
            This action cannot be undone and will cascade to all related records.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col items-center">
              <span className="text-xl font-black text-white">{invoicesCount}</span>
              <span className="text-[9px] uppercase font-bold text-gray-500">Invoices</span>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col items-center">
              <span className="text-xl font-black text-white">{expensesCount}</span>
              <span className="text-[9px] uppercase font-bold text-gray-500">Expenses</span>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col items-center">
              <span className="text-xl font-black text-white">{tasksCount}</span>
              <span className="text-[9px] uppercase font-bold text-gray-500">Tasks</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-red-400">
              Type <span className="text-white">"{project?.project_name}"</span> to confirm
            </Label>
            <Input 
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Confirm project name"
              className="bg-white/5 border-white/10 text-white h-12 focus:ring-red-500/40"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            Abort Deletion
          </Button>
          <Button 
            onClick={handleDelete}
            disabled={confirmName !== project?.project_name || isDeleting}
            className="bg-red-500 text-white font-black uppercase tracking-widest h-12 px-6 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-30"
          >
            {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : "Purge Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
