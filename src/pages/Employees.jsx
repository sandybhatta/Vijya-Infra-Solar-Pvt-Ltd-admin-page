import React, { useState, useMemo } from 'react'
import { 
  useEmployees, 
  useEmployeeTasks, 
  useLookups, 
  useEmployeeMutations, 
  useTaskMutations, 
  useRealtimeSync 
} from '@/hooks/useEmployees'
import {
  Plus,
  Search,
  Users,
  ClipboardList,
  Download,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Settings2,
  Trophy,
  LayoutDashboard,
  IndianRupee,
  Calendar,
  Phone,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import toast from 'react-hot-toast'
import { format, isAfter, subDays } from 'date-fns'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Components
import EmployeeAnalytics from '@/components/employees/EmployeeAnalytics'
import EmployeeCharts from '@/components/employees/EmployeeCharts'
import EmployeeLeaderboard from '@/components/employees/EmployeeLeaderboard'
import EmployeeProfileDrawer from '@/components/employees/EmployeeProfileDrawer'

// Zod Schemas
const employeeSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().min(10, "Invalid phone number"),
  salary: z.coerce.number().min(0, "Salary must be positive"),
  joining_date: z.string().min(1, "Joining date is required"),
  is_active: z.boolean().default(true)
})

const taskSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  task_type: z.string().min(1, "Task type is required"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  remarks: z.string().optional(),
  task_status: z.string().default('pending'),
  lead_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable()
}).refine(data => !(data.lead_id && data.project_id), {
  message: "Cannot link to both Lead and Project",
  path: ["lead_id"]
})

/**
 * Employee Add/Edit Modal
 */
const EmployeeModal = ({ open, setOpen, employee = null, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || { name: '', role: '', phone: '', salary: 0, joining_date: format(new Date(), 'yyyy-MM-dd'), is_active: true }
  })

  React.useEffect(() => {
    if (employee) reset(employee)
    else reset({ name: '', role: '', phone: '', salary: 0, joining_date: format(new Date(), 'yyyy-MM-dd'), is_active: true })
  }, [employee, open, reset])

  const onSubmit = (data) => onSave(data)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-panel border-white/10 text-white max-w-md bg-slate-900">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Personnel' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input {...register("name")} className="bg-white/5 border-white/10" placeholder="e.g. Rahul Sharma" />
              {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Input {...register("role")} className="bg-white/5 border-white/10" placeholder="e.g. Sales" />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input {...register("phone")} className="bg-white/5 border-white/10" placeholder="10-digit number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Salary (Monthly)</Label>
                <Input {...register("salary")} type="number" className="bg-white/5 border-white/10" />
              </div>
              <div className="grid gap-2">
                <Label>Joining Date</Label>
                <Input {...register("joining_date")} type="date" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="active-status" 
                checked={watch("is_active")} 
                onCheckedChange={(checked) => setValue("is_active", checked)} 
              />
              <Label htmlFor="active-status">Active Employee</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-neon-blue text-black font-black uppercase hover:bg-neon-blue/80 w-full md:w-auto">
              {employee ? 'Update Record' : 'Register Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Task Add/Edit Modal
 */
const TaskModal = ({ open, setOpen, task = null, onSave, employees = [], leads = [], projects = [] }) => {
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: task || { 
      employee_id: '', task_type: 'follow_up', 
      scheduled_date: format(new Date(), 'yyyy-MM-dd'), 
      remarks: '', task_status: 'pending' 
    }
  })

  React.useEffect(() => {
    if (task) {
        reset({
            ...task,
            employee_id: task.employee_id,
            lead_id: task.lead_id || null,
            project_id: task.project_id || null
        })
    } else {
        reset({ 
            employee_id: '', task_type: 'follow_up', 
            scheduled_date: format(new Date(), 'yyyy-MM-dd'), 
            remarks: '', task_status: 'pending' 
        })
    }
  }, [task, open, reset])

  const onSubmit = (data) => onSave(data)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-panel border-white/10 text-white max-w-lg bg-slate-900">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Mission' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select defaultValue={watch("employee_id")} onValueChange={(val) => setValue("employee_id", val)}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && <p className="text-[10px] text-red-500">{errors.employee_id.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Task Type</Label>
              <Select defaultValue={watch("task_type")} onValueChange={(val) => setValue("task_type", val)}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="site_visit">Site Visit</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
              <Label>Scheduled Date</Label>
              <Input {...register("scheduled_date")} type="date" className="bg-white/5 border-white/10" />
            </div>
            <div className="grid gap-2">
              <Label>Initial Status</Label>
              <Select defaultValue={watch("task_status")} onValueChange={(val) => setValue("task_status", val)}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Link to Entity (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label className="text-[10px] text-gray-400">Lead</Label>
                <Select value={watch("lead_id") || "none"} onValueChange={(val) => {
                  setValue("lead_id", val === 'none' ? null : val)
                  if (val !== 'none') setValue("project_id", null)
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-10">
                    <SelectValue placeholder="Select Lead" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="none">None</SelectItem>
                    {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] text-gray-400">Project</Label>
                <Select value={watch("project_id") || "none"} onValueChange={(val) => {
                  setValue("project_id", val === 'none' ? null : val)
                  if (val !== 'none') setValue("lead_id", null)
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-10">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors.lead_id && <p className="text-[10px] text-red-500 text-center">{errors.lead_id.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Remarks</Label>
            <textarea 
              {...register("remarks")}
              className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue"
              placeholder="Add any specific instructions or notes..."
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-neon-blue text-black font-black uppercase hover:bg-neon-blue/80 w-full">
              {task ? 'Update Mission' : 'Deploy Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Main Employees Page Component
 */
export default function Employees() {
  // Data State
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedTaskIds, setSelectedTaskIds] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Modal State
  const [employeeModal, setEmployeeModal] = useState({ open: false, data: null })
  const [taskModal, setTaskModal] = useState({ open: false, data: null })
  const [profileDrawer, setProfileDrawer] = useState({ open: false, data: null })

  // Hooks
  const { data: employees = [], isLoading: empLoading } = useEmployees()
  const { data: tasks = [], isLoading: tasksLoading } = useEmployeeTasks()
  const { leads, projects } = useLookups()
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployeeMutations()
  const { createTask, updateTask, deleteTask } = useTaskMutations()
  
  // Realtime Sync Init
  useRealtimeSync()

  // Computed: Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.phone.includes(searchTerm) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = roleFilter === 'all' || emp.role === roleFilter
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? emp.is_active : !emp.is_active)
      return matchSearch && matchRole && matchStatus
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'salary') return b.salary - a.salary
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
  }, [employees, searchTerm, roleFilter, statusFilter, sortBy])

  // Computed: Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = task.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.employees?.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchSearch
    })
  }, [tasks, searchTerm])

  // Handlers: Employees
  const handleSaveEmployee = async (data) => {
    try {
      if (employeeModal.data) {
        await updateEmployee.mutateAsync({ id: employeeModal.data.id, ...data })
        toast.success("Employee record updated")
      } else {
        await createEmployee.mutateAsync(data)
        toast.success("New employee registered")
      }
      setEmployeeModal({ open: false, data: null })
    } catch (error) {
      toast.error(error.message || "Failed to save employee")
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (confirm("Permanently deactivate and delete this personnel record?")) {
      try {
        await deleteEmployee.mutateAsync(id)
        toast.success("Record expunged")
      } catch (error) {
        toast.error("Deletion failed")
      }
    }
  }

  // Handlers: Tasks
  const handleSaveTask = async (data) => {
    try {
      if (taskModal.data) {
        await updateTask.mutateAsync({ id: taskModal.data.id, ...data })
        toast.success("Mission orders updated")
      } else {
        await createTask.mutateAsync(data)
        toast.success("Task deployed to field")
      }
      setTaskModal({ open: false, data: null })
    } catch (error) {
      toast.error(error.message || "Operation failed")
    }
  }

  const handleBulkStatusUpdate = async (status) => {
    try {
      const promises = selectedTaskIds.map(id => updateTask.mutateAsync({ id, task_status: status }))
      await Promise.all(promises)
      toast.success(`${selectedTaskIds.length} missions updated`)
      setSelectedTaskIds([])
    } catch (error) {
      toast.error("Bulk update failed")
    }
  }

  const handleBulkDeleteTasks = async () => {
    if (confirm(`Expunge ${selectedTaskIds.length} task records?`)) {
      try {
        const promises = selectedTaskIds.map(id => deleteTask.mutateAsync(id))
        await Promise.all(promises)
        toast.success(`${selectedTaskIds.length} records expunged`)
        setSelectedTaskIds([])
      } catch (error) {
        toast.error("Bulk deletion failed")
      }
    }
  }

  // Exports
  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(',')
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','))
    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
             Personnel <span className="text-neon-blue">Hub</span>
          </h1>
          <p className="text-gray-400 font-medium flex items-center justify-center md:justify-start gap-2 mt-2">
            <LayoutDashboard className="h-4 w-4" /> Manage crew, missions, and performance analytics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setTaskModal({ open: true, data: null })}
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 font-black uppercase"
          >
            <ClipboardList className="mr-2 h-4 w-4 text-orange-400" /> New Task
          </Button>
          <Button 
            onClick={() => setEmployeeModal({ open: true, data: null })}
            className="bg-neon-blue text-black font-black uppercase shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)]"
          >
            <Plus className="mr-2 h-4 w-4" /> Register Staff
          </Button>
        </div>
      </div>

      {/* Analytics Radar */}
      <EmployeeAnalytics employees={employees} tasks={tasks} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-white/5 border border-white/5 p-1 h-12 w-full md:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black font-bold flex gap-2">
              <Users className="h-4 w-4" /> Staff Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black font-bold flex gap-2">
              <ClipboardList className="h-4 w-4" /> Mission Control
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black font-bold flex gap-2 hidden md:flex">
              <Trophy className="h-4 w-4" /> Insights
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/10 text-white pl-10 h-10 w-full"
              />
            </div>
            <Button 
              size="icon" 
              variant="outline" 
              className="bg-white/5 border-white/10 text-white h-10 w-10 shrink-0"
              onClick={() => exportToCSV(activeTab === 'overview' ? filteredEmployees : filteredTasks, `${activeTab}-export.csv`)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab 1: Staff Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Personnel</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Salary</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasks Rank</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {empLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-6 py-4 h-16 bg-white/5 opacity-50"></td>
                      </tr>
                    ))
                  ) : filteredEmployees.map((emp) => {
                    const empTasks = tasks.filter(t => t.employee_id === emp.id)
                    const pending = empTasks.filter(t => t.task_status === 'pending').length
                    const doneRec = empTasks.filter(t => t.task_status === 'done' && isAfter(new Date(t.completed_date), subDays(new Date(), 30))).length

                    return (
                      <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10 group-hover:border-neon-blue transition-colors">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`} />
                              <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-white text-sm">{emp.name}</p>
                              <p className="text-[10px] text-gray-500 font-medium">{emp.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-black border-white/10 text-gray-400 uppercase tracking-tighter">
                            {emp.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-white">₹{Number(emp.salary).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={emp.is_active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                            {emp.is_active ? "ACTIVE" : "OFF-DUTY"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="text-center">
                               <p className="text-xs font-black text-white">{pending}</p>
                               <p className="text-[8px] text-orange-400 uppercase">Wait</p>
                             </div>
                             <div className="text-center">
                               <p className="text-xs font-black text-white">{doneRec}</p>
                               <p className="text-[8px] text-emerald-400 uppercase">30d</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                              <DropdownMenuItem onClick={() => setProfileDrawer({ open: true, data: emp })}>
                                <Eye className="mr-2 h-4 w-4" /> View Intel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEmployeeModal({ open: true, data: emp })}>
                                <Edit className="mr-2 h-4 w-4" /> Modify
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem onClick={() => handleDeleteEmployee(emp.id)} className="text-red-400">
                                <Trash2 className="mr-2 h-4 w-4" /> Expunge
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="p-4 space-y-4" onClick={() => setProfileDrawer({ open: true, data: emp })}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-white/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`} />
                        <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-white text-base">{emp.name}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{emp.role}</p>
                      </div>
                    </div>
                    <Badge className={emp.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-500"}>
                       {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-300">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-neon-blue" /> {emp.phone}</span>
                    <span className="font-black">₹{Number(emp.salary).toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 h-9" 
                      onClick={(e) => { e.stopPropagation(); setEmployeeModal({ open: true, data: emp }) }}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="px-3 bg-white/5 border-white/10 h-9 text-red-400"
                      onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id) }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Mission Control */}
        <TabsContent value="tasks" className="space-y-6">
          
          {/* Bulk Actions Bar */}
          {selectedTaskIds.length > 0 && (
            <div className="bg-neon-blue text-black p-4 rounded-xl flex items-center justify-between shadow-[0_0_20px_rgba(0,229,255,0.2)] animate-in slide-in-from-top-4">
              <span className="font-black uppercase tracking-tighter text-sm">
                {selectedTaskIds.length} Missions Selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkStatusUpdate('done')} className="bg-black text-white hover:bg-black/80 font-bold">
                  Mark Done
                </Button>
                <Button size="sm" onClick={handleBulkDeleteTasks} className="bg-red-600 text-white hover:bg-red-700 font-bold">
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTaskIds([])} className="text-black font-bold">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl bg-white/5">
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0} 
                        onChange={(e) => setSelectedTaskIds(e.target.checked ? filteredTasks.map(t => t.id) : [])}
                        className="rounded border-white/20 bg-white/5"
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Task Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Personnel</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Scheduled</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Context</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tasksLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse h-16 bg-white/5 opacity-50"></tr>
                    ))
                  ) : filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                       <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={(e) => {
                            setSelectedTaskIds(prev => e.target.checked ? [...prev, task.id] : prev.filter(id => id !== task.id))
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${
                             task.task_status === 'done' ? 'bg-green-400' : 
                             task.task_status === 'cancelled' ? 'bg-red-500' : 'bg-orange-400'
                           }`} />
                           <span className="text-sm font-bold text-white capitalize">{task.task_type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.employee_id}`} />
                              <AvatarFallback>{task.employees?.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span className="text-sm text-gray-300">{task.employees?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">{format(new Date(task.scheduled_date), 'MMM dd, yyyy')}</span>
                      </td>
                      <td className="px-6 py-4">
                         {(task.leads || task.projects) ? (
                            <Badge variant="outline" className="border-neon-blue/30 text-neon-blue text-[10px]">
                               {task.leads?.name || task.projects?.project_name}
                            </Badge>
                         ) : <span className="text-gray-600 text-xs">Generic</span>}
                      </td>
                      <td className="px-6 py-4">
                         <Badge className={
                            task.task_status === 'done' ? 'bg-green-500/20 text-green-400' :
                            task.task_status === 'cancelled' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'
                         }>
                            {task.task_status.toUpperCase()}
                         </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" onClick={() => setTaskModal({ open: true, data: task })} className="text-blue-400 h-8 w-8">
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => {
                             if(confirm("Expunge mission record?")) deleteTask.mutate(task.id)
                           }} className="text-red-400 h-8 w-8">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        </TabsContent>

        {/* Tab 3: Insights & Productivity */}
        <TabsContent value="insights" className="space-y-6">
           <EmployeeCharts employees={employees} tasks={tasks} />
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmployeeLeaderboard employees={employees} tasks={tasks} />
              <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="h-16 w-16 rounded-full bg-neon-blue/20 flex items-center justify-center">
                    <Settings2 className="h-8 w-8 text-neon-blue animate-spin" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">System Optimization</h3>
                    <p className="text-gray-400 text-sm max-w-xs mt-2">
                       The personnel dashboard is synchronizing in real-time. All metrics are updated dynamically based on field missions and status reports.
                    </p>
                 </div>
                 <div className="flex gap-2 w-full pt-4">
                    <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Uptime</p>
                        <p className="text-lg font-black text-white">99.9%</p>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Sync Lag</p>
                        <p className="text-lg font-black text-emerald-400">0.2ms</p>
                    </div>
                 </div>
              </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Modals & Overlays */}
      <EmployeeModal 
        open={employeeModal.open} 
        setOpen={(open) => setEmployeeModal({ open, data: employeeModal.data })} 
        employee={employeeModal.data}
        onSave={handleSaveEmployee}
      />

      <TaskModal 
        open={taskModal.open} 
        setOpen={(open) => setTaskModal({ open, data: taskModal.data })} 
        task={taskModal.data}
        onSave={handleSaveTask}
        employees={employees}
        leads={leads.data || []}
        projects={projects.data || []}
      />

      <EmployeeProfileDrawer 
        open={profileDrawer.open} 
        setOpen={(open) => setProfileDrawer({ open, data: profileDrawer.data })} 
        employee={profileDrawer.data}
        tasks={tasks}
      />

    </div>
  )
}
