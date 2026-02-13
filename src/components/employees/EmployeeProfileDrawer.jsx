import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Phone, 
  Briefcase, 
  Calendar, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Link as LinkIcon
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EmployeeProfileDrawer({ open, setOpen, employee, tasks = [] }) {
  if (!employee) return null

  const empTasks = tasks.filter(t => t.employee_id === employee.id)
  const completedTasks = empTasks.filter(t => t.task_status === 'done')
  const pendingTasks = empTasks.filter(t => t.task_status === 'pending')
  const cancelledTasks = empTasks.filter(t => t.task_status === 'cancelled')
  
  // Calculate Avg Completion Time
  const avgCompletionTime = completedTasks.length > 0 
    ? (completedTasks.reduce((acc, t) => {
        if (t.scheduled_date && t.completed_date) {
          return acc + differenceInDays(new Date(t.completed_date), new Date(t.scheduled_date))
        }
        return acc
      }, 0) / completedTasks.length).toFixed(1)
    : 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md bg-slate-900 border-white/10 text-white p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="mb-8">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.id}`} />
                  <AvatarFallback className="text-xl">{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <SheetTitle className="text-2xl font-black text-white">{employee.name}</SheetTitle>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 capitalize">
                      {employee.role}
                    </Badge>
                    <Badge className={employee.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-8">
              {/* Contact & Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Phone</p>
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <Phone className="h-3 w-3 text-neon-blue" />
                    {employee.phone}
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Salary</p>
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <IndianRupee className="h-3 w-3 text-emerald-400" />
                    ₹{Number(employee.salary).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Joining Date</p>
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <Calendar className="h-3 w-3 text-violet-400" />
                    {format(new Date(employee.joining_date), 'PPP')}
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 px-1">Performance Stats</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-lg font-black text-emerald-400">{completedTasks.length}</p>
                    <p className="text-[8px] uppercase tracking-tighter text-gray-400">Done</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <p className="text-lg font-black text-orange-400">{pendingTasks.length}</p>
                    <p className="text-[8px] uppercase tracking-tighter text-gray-400">Pending</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-lg font-black text-red-400">{cancelledTasks.length}</p>
                    <p className="text-[8px] uppercase tracking-tighter text-gray-400">Failed</p>
                  </div>
                </div>
                <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center px-4">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-2">
                     <Clock className="h-3 w-3" /> Avg. Turnaround
                  </span>
                  <span className="text-sm font-black text-neon-blue">{avgCompletionTime} Days</span>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 px-1">Recent Activity</h4>
                <div className="space-y-4 relative before:absolute before:left-2.5 before:top-0 before:bottom-0 before:w-[1px] before:bg-white/10">
                  {empTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="relative pl-8">
                      <div className={`absolute left-0 top-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900 ${
                        task.task_status === 'done' ? 'bg-emerald-500' : 
                        task.task_status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500'
                      }`}>
                         {task.task_status === 'done' ? <CheckCircle2 className="h-3 w-3 text-white" /> : 
                          task.task_status === 'cancelled' ? <XCircle className="h-3 w-3 text-white" /> : 
                          <Clock className="h-3 w-3 text-white" />}
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-black text-white capitalize">{task.task_type.replace('_', ' ')}</p>
                          <p className="text-[9px] text-gray-500">{format(new Date(task.scheduled_date), 'MMM d')}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-2">{task.remarks || 'No remarks provided'}</p>
                        
                        {(task.leads || task.projects) && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-[9px] text-neon-blue font-bold">
                            <LinkIcon className="h-2 w-2" />
                            {task.leads?.name || task.projects?.project_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {empTasks.length === 0 && (
                     <p className="text-center text-xs text-gray-500 italic py-4">No task history found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
