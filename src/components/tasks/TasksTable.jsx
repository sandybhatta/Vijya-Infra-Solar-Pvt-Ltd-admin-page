import React, { useState } from 'react'
import { format } from 'date-fns'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreVertical, Eye, Edit, Trash2, User, Briefcase, Phone } from 'lucide-react'
import { TaskTypeBadge, TaskStatusBadge, TaskPriorityBadge } from './TaskBadges'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Helper to calculate priority
function calculatePriority(task) {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (task.task_status === 'pending') {
    if (task.scheduled_date < today) return 'high' // Overdue
    if (task.scheduled_date === today) return 'high' // Due today
    const daysUntil = Math.ceil((new Date(task.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 3) return 'medium'
  }
  return 'low'
}

// Mobile Card View
function TaskMobileCard({ task, onEdit, onDelete, onView, isSelected, onSelect }) {
  const priority = calculatePriority(task)
  const isOverdue = task.task_status === 'pending' && task.scheduled_date < format(new Date(), 'yyyy-MM-dd')
  const isDueToday = task.scheduled_date === format(new Date(), 'yyyy-MM-dd')

  return (
    <Card className={`bg-white/5 border-white/10 ${isOverdue ? 'border-l-4 border-l-red-500' : isDueToday ? 'border-l-4 border-l-yellow-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="border-white/20"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <TaskTypeBadge type={task.task_type} />
                <TaskStatusBadge status={task.task_status} />
                <TaskPriorityBadge priority={priority} />
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
              <DropdownMenuItem onClick={() => onView(task)} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task)} className="cursor-pointer text-red-400">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Employee Info */}
        {task.employees && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-white font-medium">{task.employees.name}</span>
            <span className="text-gray-500 text-xs">• {task.employees.role}</span>
          </div>
        )}

        {/* Linked Entity */}
        {task.leads && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-blue-400" />
            <span className="text-gray-300">{task.leads.name}</span>
            <span className="text-gray-500 text-xs">• {task.leads.phone_number}</span>
          </div>
        )}
        {task.projects && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-purple-400" />
            <span className="text-gray-300">{task.projects.project_name}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Scheduled: {format(new Date(task.scheduled_date), 'MMM dd, yyyy')}</span>
          {task.completed_date && (
            <span className="text-green-400">Done: {format(new Date(task.completed_date), 'MMM dd')}</span>
          )}
        </div>

        {/* Remarks */}
        {task.remarks && (
          <p className="text-xs text-gray-400 line-clamp-2">{task.remarks}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function TasksTable({ 
  tasks = [], 
  isLoading, 
  onEdit, 
  onDelete, 
  onView,
  selectedTasks = [],
  onSelectTask,
  onSelectAll
}) {
  const [sortField, setSortField] = useState('scheduled_date')
  const [sortDirection, setSortDirection] = useState('desc')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Desktop Skeleton */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                {[...Array(8)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-white/10" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
        <div className="bg-white/5 p-6 md:p-8 rounded-full mb-4">
          <Briefcase className="h-12 w-12 md:h-16 md:w-16 text-gray-600" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Tasks Found</h3>
        <p className="text-sm md:text-base text-gray-400 mb-4">Create your first task to get started</p>
      </div>
    )
  }

  const allSelected = tasks.length > 0 && selectedTasks.length === tasks.length

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {tasks.map(task => (
          <TaskMobileCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            isSelected={selectedTasks.includes(task.id)}
            onSelect={() => onSelectTask(task.id)}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  className="border-white/20"
                />
              </TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Type</TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Status</TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Priority</TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Employee</TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Linked To</TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Scheduled</TableHead>
              <TableHead className="text-xs font-black uppercase text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => {
              const priority = calculatePriority(task)
              const isOverdue = task.task_status === 'pending' && task.scheduled_date < format(new Date(), 'yyyy-MM-dd')
              const isDueToday = task.scheduled_date === format(new Date(), 'yyyy-MM-dd')
              const isDone = task.task_status === 'done'

              return (
                <TableRow 
                  key={task.id} 
                  className={`border-white/5 ${isOverdue ? 'bg-red-900/10' : isDueToday ? 'bg-yellow-900/10' : isDone ? 'opacity-60' : ''}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => onSelectTask(task.id)}
                      className="border-white/20"
                    />
                  </TableCell>
                  <TableCell>
                    <TaskTypeBadge type={task.task_type} />
                  </TableCell>
                  <TableCell>
                    <TaskStatusBadge status={task.task_status} />
                  </TableCell>
                  <TableCell>
                    <TaskPriorityBadge priority={priority} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-white">{task.employees?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{task.employees?.role}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.leads && (
                      <div className="text-sm">
                        <div className="text-blue-400">{task.leads.name}</div>
                        <div className="text-xs text-gray-500">{task.leads.phone_number}</div>
                      </div>
                    )}
                    {task.projects && (
                      <div className="text-sm">
                        <div className="text-purple-400">{task.projects.project_name}</div>
                        <div className="text-xs text-gray-500">{task.projects.project_status}</div>
                      </div>
                    )}
                    {!task.leads && !task.projects && <span className="text-gray-500 text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">
                      {format(new Date(task.scheduled_date), 'MMM dd, yyyy')}
                    </div>
                    {task.completed_date && (
                      <div className="text-xs text-green-400">
                        Done: {format(new Date(task.completed_date), 'MMM dd')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={() => onView(task)} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(task)} className="cursor-pointer text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
