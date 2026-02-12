import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ChevronRight, 
  MoreVertical, 
  Plus, 
  CheckCircle, 
  FileDown,
  ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUpdateProjectMutation } from '@/features/projects/projectsApi'
import toast from 'react-hot-toast'

export default function ProjectHeader({ project }) {
  const navigate = useNavigate()
  const [updateProject] = useUpdateProjectMutation()

  const handleStatusChange = async (newStatus) => {
    try {
      const updates = { project_status: newStatus }
      if (newStatus === 'completed') {
        updates.completion_date = new Date().toISOString().split('T')[0]
      }
      await updateProject({ id: project.id, ...updates }).unwrap()
      toast.success(`Project marked as ${newStatus}`)
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const statusColors = {
    ongoing: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20",
    completed: "bg-neon-green/10 text-neon-green border-neon-green/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20"
  }

  return (
    <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
        <Link to="/projects" className="hover:text-neon-blue transition-colors">Projects Library</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300">{project.project_name || "Project Details"}</span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/projects')}
            className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                {project.project_name}
              </h1>
              <Badge className={statusColors[project.project_status]}>
                {project.project_status}
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 tracking-widest leading-none">
              Client: <span className="text-neon-blue">{project.leads?.name}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              Type: <span className="text-neon-purple">{project.solar_type}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {/* Status Quick Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white/5 border-white/10 text-gray-300 h-10 px-4 group">
                <span className="mr-2 uppercase font-black text-[10px] tracking-widest">Update State</span>
                <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
              <DropdownMenuItem onClick={() => handleStatusChange('ongoing')} className="focus:bg-neon-yellow/10 focus:text-neon-yellow">Mark Ongoing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')} className="focus:bg-neon-green/10 focus:text-neon-green font-bold">Mark Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('cancelled')} className="focus:bg-red-500/10 focus:text-red-500">Mark Cancelled</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="bg-white/5 border-white/10 text-gray-300 h-10 px-4">
            <FileDown className="mr-2 h-4 w-4 text-neon-cyan" />
            <span className="uppercase font-black text-[10px] tracking-widest whitespace-nowrap">Export Dossier</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-neon-blue text-black font-black uppercase tracking-widest h-10 px-6 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <Plus className="mr-2 h-5 w-5" /> Operation
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white backdrop-blur-xl w-56">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Financial Actions</DropdownMenuLabel>
              <DropdownMenuItem className="focus:bg-white/10 focus:text-neon-blue py-3"><Plus className="mr-2 h-4 w-4"/> New Invoice</DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/10 focus:text-neon-green py-3"><Plus className="mr-2 h-4 w-4"/> Record Payment</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Resource Actions</DropdownMenuLabel>
              <DropdownMenuItem className="focus:bg-white/10 py-3"><Plus className="mr-2 h-4 w-4"/> Add Expense</DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/10 py-3"><Plus className="mr-2 h-4 w-4"/> Assign Material</DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/10 py-3"><Plus className="mr-2 h-4 w-4"/> Assign Task</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
