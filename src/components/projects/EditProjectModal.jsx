import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateProjectMutation } from '@/features/projects/projectsApi'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const editProjectSchema = z.object({
  project_name: z.string().min(3, "Project name must be at least 3 characters"),
  solar_type: z.string(),
  capacity_kw: z.string().transform((v) => Number(v)).pipe(z.number().positive()),
  installation_address: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  completion_date: z.string().min(1, "Completion date is required"),
  project_status: z.enum(['ongoing', 'completed', 'cancelled']),
}).refine((data) => {
  if (data.start_date && data.completion_date) {
    return new Date(data.completion_date) >= new Date(data.start_date)
  }
  return true
}, {
  message: "Completion date cannot be before start date",
  path: ["completion_date"],
})

export default function EditProjectModal({ open, setOpen, project }) {
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editProjectSchema),
  })

  useEffect(() => {
    if (project) {
      reset({
        project_name: project.project_name,
        solar_type: project.solar_type || 'Residential',
        capacity_kw: String(project.capacity_kw || 0),
        installation_address: project.installation_address || '',
        start_date: project.start_date || '',
        completion_date: project.completion_date || '',
        project_status: project.project_status || 'ongoing',
      })
    }
  }, [project, reset])

  const onSubmit = async (data) => {
    try {
      await updateProject({ id: project.id, ...data }).unwrap()
      toast.success("Project updated successfully!")
      setOpen(false)
    } catch (error) {
      toast.error(error.message || "Failed to update project")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-black/95 border-neon-blue/20 text-white backdrop-blur-2xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple tracking-tighter uppercase">
            Edit Project Parameters
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Project Branding</Label>
              <Input 
                {...register('project_name')}
                className="bg-white/5 border-white/10 text-white h-12 focus:ring-neon-blue/40 font-bold"
              />
              {errors.project_name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.project_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Status</Label>
              <Select defaultValue={project?.project_status} onValueChange={(val) => setValue('project_status', val)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Installation Type</Label>
              <Select defaultValue={project?.solar_type || 'Residential'} onValueChange={(val) => setValue('solar_type', val)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Off-Grid">Off-Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Capacity (kW DC)</Label>
              <Input 
                type="number"
                step="0.01"
                {...register('capacity_kw')}
                className="bg-white/5 border-white/10 text-white h-12"
              />
              {errors.capacity_kw && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.capacity_kw.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Deployment Start</Label>
              <Input 
                type="date"
                {...register('start_date')}
                className="bg-white/5 border-white/10 text-white h-12 [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Target Completion</Label>
              <Input 
                type="date"
                {...register('completion_date')}
                className="bg-white/5 border-white/10 text-white h-12 [color-scheme:dark]"
              />
              {errors.completion_date && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.completion_date.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Installation Address</Label>
              <Input 
                {...register('installation_address')}
                className="bg-white/5 border-white/10 text-white h-12"
              />
            </div>
          </div>

          <DialogFooter className="mt-8 border-t border-white/5 pt-6">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={isUpdating}
                className="bg-neon-yellow text-black font-black uppercase tracking-widest h-12 px-8 hover:bg-neon-yellow/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
