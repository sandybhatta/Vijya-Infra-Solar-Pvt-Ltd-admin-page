import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2,
  Calendar,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { useAddTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetEmployeesQuery } from '@/features/hr/hrApi'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { clsx } from 'clsx'

export default function ProjectTasksTab({ project }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [updateTaskStatus] = useUpdateTaskMutation()
    const [deleteTask] = useDeleteTaskMutation()

    const tasks = project.tasks || []

    const handleStatusToggle = async (task) => {
        const nextStatus = task.task_status === 'completed' ? 'pending' : 'completed'
        try {
            await updateTaskStatus({ id: task.id, task_status: nextStatus }).unwrap()
            toast.success(`Task marked as ${nextStatus}`)
        } catch (error) {
            toast.error("Status update failed")
        }
    }

    const handleDelete = async (id) => {
        if (confirm("Permanently remove this task?")) {
            await deleteTask(id)
            toast.success("Task deleted")
        }
    }

    const statusIcons = {
        pending: <Clock className="h-3 w-3 text-neon-yellow" />,
        in_progress: <Clock className="h-3 w-3 text-neon-blue animate-pulse" />,
        completed: <CheckCircle2 className="h-3 w-3 text-neon-green" />
    }

    const statusVariants = {
        pending: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20",
        in_progress: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
        completed: "bg-neon-green/10 text-neon-green border-neon-green/20"
    }

    return (
        <div className="space-y-6 mt-4">
            <Card className="bg-glass-bg border-glass-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neon-blue" /> Deployment Roadmap
                    </CardTitle>
                    <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-neon-blue text-black font-black uppercase text-[10px]">
                        <Plus className="h-3 w-3 mr-1" /> New Task
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Operation</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Assignee</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500">Scheduled</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task) => (
                                <TableRow key={task.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleStatusToggle(task)}
                                            className={clsx(
                                                "h-6 w-6 rounded border transition-colors",
                                                task.task_status === 'completed' ? "bg-neon-green border-neon-green text-black" : "border-white/20 text-transparent hover:border-neon-blue"
                                            )}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={clsx("font-bold text-white uppercase text-xs", task.task_status === 'completed' && "line-through text-gray-500")}>
                                                {task.task_name}
                                            </span>
                                            {task.description && <span className="text-[9px] text-gray-500 truncate max-w-[200px]">{task.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                                <User className="h-3 w-3 text-gray-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-gray-300">{task.employees?.name || 'Unassigned'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={clsx("capitalize font-black text-[9px] flex items-center gap-1 w-fit", statusVariants[task.task_status] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
                                            {statusIcons[task.task_status]}
                                            {task.task_status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-400 font-mono text-[10px] uppercase">
                                        {task.scheduled_date ? format(new Date(task.scheduled_date), 'dd MMM yyyy') : 'No Date'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="h-8 w-8 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tasks.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-500 font-bold uppercase text-xs">Zero tasks in roadmap</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddTaskModal open={isModalOpen} setOpen={setIsModalOpen} projectId={project.id} />
        </div>
    )
}

function AddTaskModal({ open, setOpen, projectId }) {
    const { data: employeesData } = useGetEmployeesQuery({ page: 1, limit: 100 })
    const [addTask, { isLoading }] = useAddTaskMutation()
    
    const [formData, setFormData] = useState({
        task_name: '',
        employee_id: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        task_status: 'pending',
        description: ''
    })

    const employees = employeesData?.employees || []

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await addTask({ ...formData, project_id: projectId }).unwrap()
            toast.success("Task deployed to team")
            setOpen(false)
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black/95 border-white/10 text-white backdrop-blur-2xl">
                <DialogHeader><DialogTitle className="uppercase font-black italic text-neon-blue">Deploy New Task</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Task Definition</Label>
                        <Input value={formData.task_name} onChange={e => setFormData({...formData, task_name: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. Roof Inspection" required />
                    </div>
                    <div className="grid gap-2">
                        <Label className="uppercase text-[10px] font-black text-gray-500">Chief Assignee</Label>
                        <Select onValueChange={val => setFormData({...formData, employee_id: val})}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10 text-white">
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                             <Label className="uppercase text-[10px] font-black text-gray-500">Mission Start</Label>
                             <Input type="date" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" required />
                        </div>
                        <div className="grid gap-2">
                             <Label className="uppercase text-[10px] font-black text-gray-500">Initial State</Label>
                             <Select defaultValue="pending" onValueChange={val => setFormData({...formData, task_status: val})}>
                                <SelectTrigger className="bg-white/5 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/10 text-white">
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                         <Label className="uppercase text-[10px] font-black text-gray-500">Operation Brief (Optional)</Label>
                         <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10" placeholder="Brief technical notes..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-neon-blue text-black font-black uppercase tracking-widest w-full">Deploy Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
