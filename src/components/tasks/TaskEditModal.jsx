import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateTaskMutation } from '@/features/tasks/tasksApi'
import { useGetEmployeesQuery } from '@/features/hr/hrApi'
import { useGetLeadsQuery } from '@/features/leads/leadsApi'
import { useGetProjectsQuery } from '@/features/projects/projectsApi'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function TaskEditModal({ open, setOpen, task, onSuccess }) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation()
  const { data: empData } = useGetEmployeesQuery({ page: 1, limit: 100 })
  const { data: leadsData } = useGetLeadsQuery({ page: 1, limit: 100 })
  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 100 })

  const employees = empData?.employees || []
  const leads = leadsData?.leads || []
  const projects = projectsData?.projects || []

  const [formData, setFormData] = useState({
    employee_id: '',
    task_type: 'follow_up',
    task_status: 'pending',
    scheduled_date: '',
    link_type: 'none',
    lead_id: null,
    project_id: null,
    remarks: ''
  })

  useEffect(() => {
    if (task) {
      setFormData({
        employee_id: task.employee_id || '',
        task_type: task.task_type || 'follow_up',
        task_status: task.task_status || 'pending',
        scheduled_date: task.scheduled_date || '',
        link_type: task.lead_id ? 'lead' : task.project_id ? 'project' : 'none',
        lead_id: task.lead_id || null,
        project_id: task.project_id || null,
        remarks: task.remarks || ''
      })
    }
  }, [task])

  const taskTypes = [
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'site_visit', label: 'Site Visit' },
    { value: 'installation', label: 'Installation' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'call', label: 'Call' }
  ]

  const taskStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const updates = {
        id: task.id,
        employee_id: formData.employee_id,
        task_type: formData.task_type,
        task_status: formData.task_status,
        scheduled_date: formData.scheduled_date,
        remarks: formData.remarks || null,
        lead_id: formData.link_type === 'lead' ? formData.lead_id : null,
        project_id: formData.link_type === 'project' ? formData.project_id : null
      }

      await updateTask(updates).unwrap()
      toast.success('Task updated successfully!')
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error(error?.message || 'Failed to update task')
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-black/95 border-neon-blue/20 text-white backdrop-blur-2xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-wider text-neon-blue">
            Edit Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-gray-400">
              Assign To Employee
            </Label>
            <Select 
              value={formData.employee_id} 
              onValueChange={(val) => setFormData({ ...formData, employee_id: val })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400">Task Type</Label>
              <Select 
                value={formData.task_type} 
                onValueChange={(val) => setFormData({ ...formData, task_type: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  {taskTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400">Status</Label>
              <Select 
                value={formData.task_status} 
                onValueChange={(val) => setFormData({ ...formData, task_status: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  {taskStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-gray-400">
              Scheduled Date
            </Label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Link Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-gray-400">Link To</Label>
            <Select 
              value={formData.link_type} 
              onValueChange={(val) => setFormData({ ...formData, link_type: val, lead_id: null, project_id: null })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="lead">Link to Lead</SelectItem>
                <SelectItem value="project">Link to Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lead Selection */}
          {formData.link_type === 'lead' && (
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400">Select Lead</Label>
              <Select 
                value={formData.lead_id || ''} 
                onValueChange={(val) => setFormData({ ...formData, lead_id: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose a lead" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Project Selection */}
          {formData.link_type === 'project' && (
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400">Select Project</Label>
              <Select 
                value={formData.project_id || ''} 
                onValueChange={(val) => setFormData({ ...formData, project_id: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-gray-400">
              Remarks / Notes
            </Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Add any additional notes or instructions..."
              className="bg-white/5 border-white/10 text-white min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-neon-yellow text-black font-black uppercase tracking-widest hover:bg-neon-yellow/80"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
