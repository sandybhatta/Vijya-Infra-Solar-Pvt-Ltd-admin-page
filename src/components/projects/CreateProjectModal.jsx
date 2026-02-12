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
import { useGetLeadsQuery } from '@/features/leads/leadsApi'
import { useAddProjectMutation } from '@/features/projects/projectsApi'
import toast from 'react-hot-toast'
import { Loader2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const projectSchema = z.object({
  lead_id: z.string().uuid("Please select a customer"),
  project_name: z.string().min(3, "Project name must be at least 3 characters"),
  solar_type: z.string(),
  capacity_kw: z.string().transform((v) => Number(v)).pipe(z.number().positive()),
  installation_address: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  completion_date: z.string().min(1, "Completion date is required"),
  project_status: z.enum(['ongoing', 'completed', 'cancelled']).default('ongoing'),
}).refine((data) => {
  if (data.start_date && data.completion_date) {
    return new Date(data.completion_date) >= new Date(data.start_date)
  }
  return true
}, {
  message: "Completion date cannot be before start date",
  path: ["completion_date"],
})

export default function CreateProjectModal({ open, setOpen }) {
  const navigate = useNavigate()
  const { data: leadsData } = useGetLeadsQuery({ page: 1, limit: 100 })
  const [addProject, { isLoading: isAdding }] = useAddProjectMutation()
  
  const leads = leadsData?.leads || []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      solar_type: 'Residential',
      project_status: 'ongoing',
    }
  })

  const selectedLeadId = watch('lead_id')
  const projectName = watch('project_name')

  // Auto-suggest project name when lead is selected
  useEffect(() => {
    if (selectedLeadId && !projectName) {
      const lead = leads.find(l => l.id === selectedLeadId)
      if (lead) {
        setValue('project_name', `${lead.name} Solar Installation`)
      }
    }
  }, [selectedLeadId, leads, setValue, projectName])

  const onSubmit = async (data) => {
    try {
      const result = await addProject(data).unwrap()
      toast.success("Project created successfully!")
      setOpen(false)
      reset()
      navigate(`/projects/${result.id}`)
    } catch (error) {
      toast.error(error.message || "Failed to create project")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-black/95 border-neon-blue/20 text-white backdrop-blur-2xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,243,255,0.05)_0%,transparent_50%)] pointer-events-none" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple tracking-tighter uppercase">
            Initialize New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Target Customer (Lead)</Label>
              <Select onValueChange={(val) => setValue('lead_id', val)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 focus:ring-neon-blue/40">
                  <SelectValue placeholder="Select a verified lead" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id} className="focus:bg-neon-blue/10 focus:text-neon-blue hover:cursor-pointer p-3">
                      <div className="flex flex-col">
                        <span className="font-bold">{lead.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{lead.city}, {lead.state} | {lead.phone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lead_id && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.lead_id.message}</p>}
            </div>

            {/* Project Name */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Project Branding</Label>
              <Input 
                {...register('project_name')}
                placeholder="e.g. Skyline Mall Phase 1" 
                className="bg-white/5 border-white/10 text-white h-12 focus:ring-neon-blue/40 font-bold"
              />
              {errors.project_name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.project_name.message}</p>}
            </div>

            {/* Solar Type */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Installation Type</Label>
              <Select defaultValue="Residential" onValueChange={(val) => setValue('solar_type', val)}>
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

            {/* Capacity */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Capacity (kW DC)</Label>
              <Input 
                type="number"
                step="0.01"
                {...register('capacity_kw')}
                placeholder="5.0"
                className="bg-white/5 border-white/10 text-white h-12"
              />
              {errors.capacity_kw && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.capacity_kw.message}</p>}
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Deployment Start</Label>
              <Input 
                type="date"
                {...register('start_date')}
                className="bg-white/5 border-white/10 text-white h-12 [color-scheme:dark]"
              />
              {errors.start_date && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.start_date.message}</p>}
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
                placeholder="Enter full site address"
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
                disabled={isAdding}
                className="bg-neon-blue text-black font-black uppercase tracking-widest h-12 px-8 hover:bg-neon-blue/80 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              {isAdding ? <Loader2 className="animate-spin h-5 w-5" /> : "Deploy Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
