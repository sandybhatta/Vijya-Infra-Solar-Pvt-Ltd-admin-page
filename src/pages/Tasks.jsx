import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Trash2, Edit, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useGetTasksWithDetailsQuery, useGetTasksAnalyticsQuery, useDeleteTaskMutation, useBulkDeleteTasksMutation, useBulkUpdateTasksMutation } from '@/features/tasks/tasksApi'
import { useGetEmployeesQuery } from '@/features/hr/hrApi'
import TasksKPI from '@/components/tasks/TasksKPI'
import TasksFilters from '@/components/tasks/TasksFilters'
import TasksTable from '@/components/tasks/TasksTable'
import TaskCreateModal from '@/components/tasks/TaskCreateModal'
import TaskEditModal from '@/components/tasks/TaskEditModal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function Tasks() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    taskType: '',
    employeeId: '',
    onlyOverdue: false,
    onlyToday: false
  })

  const [selectedTasks, setSelectedTasks] = useState([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)

  // Queries
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useGetTasksWithDetailsQuery({
    page,
    limit: 50,
    ...filters
  })

  const { data: analyticsData, isLoading: analyticsLoading } = useGetTasksAnalyticsQuery()
  const { data: empData } = useGetEmployeesQuery({ page: 1, limit: 100 })

  // Mutations
  const [deleteTask] = useDeleteTaskMutation()
  const [bulkDeleteTasks] = useBulkDeleteTasksMutation()
  const [bulkUpdateTasks] = useBulkUpdateTasksMutation()

  const tasks = tasksData?.tasks || []
  const totalTasks = tasksData?.total || 0
  const employees = empData?.employees || []

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      taskType: '',
      employeeId: '',
      onlyOverdue: false,
      onlyToday: false
    })
    setPage(1)
  }

  // Handle task selection
  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(tasks.map(t => t.id))
    }
  }

  // Handle delete
  const handleDeleteClick = (task) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteTask(taskToDelete.id).unwrap()
      toast.success('Task deleted successfully')
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  // Handle edit
  const handleEditClick = (task) => {
    setTaskToEdit(task)
    setEditModalOpen(true)
  }

  // Handle view (placeholder for future drawer)
  const handleViewClick = (task) => {
    toast.success('View details coming soon!')
  }

  // Bulk actions
  const handleBulkMarkDone = async () => {
    try {
      await bulkUpdateTasks({ 
        ids: selectedTasks, 
        updates: { task_status: 'done', completed_date: format(new Date(), 'yyyy-MM-dd') }
      }).unwrap()
      toast.success(`${selectedTasks.length} tasks marked as done`)
      setSelectedTasks([])
    } catch (error) {
      toast.error('Failed to update tasks')
    }
  }

  const handleBulkMarkPending = async () => {
    try {
      await bulkUpdateTasks({ 
        ids: selectedTasks, 
        updates: { task_status: 'pending', completed_date: null }
      }).unwrap()
      toast.success(`${selectedTasks.length} tasks marked as pending`)
      setSelectedTasks([])
    } catch (error) {
      toast.error('Failed to update tasks')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.length} tasks? This cannot be undone.`)) return
    
    try {
      await bulkDeleteTasks(selectedTasks).unwrap()
      toast.success(`${selectedTasks.length} tasks deleted`)
      setSelectedTasks([])
    } catch (error) {
      toast.error('Failed to delete tasks')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const csvData = tasks.map(task => ({
      'Task Type': task.task_type,
      'Status': task.task_status,
      'Employee': task.employees?.name || 'N/A',
      'Lead': task.leads?.name || '',
      'Project': task.projects?.project_name || '',
      'Scheduled Date': task.scheduled_date,
      'Completed Date': task.completed_date || '',
      'Remarks': task.remarks || ''
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('CSV exported successfully')
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Tasks
          </h1>
          <p className="text-sm md:text-base text-gray-400 mt-1">
            Manage employee follow-ups, site visits, installations and deadlines
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTasks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9 md:h-10 text-xs md:text-sm"
                >
                  <Edit className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Bulk Actions ({selectedTasks.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                <DropdownMenuItem onClick={handleBulkMarkDone} className="cursor-pointer">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  Mark as Done
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkMarkPending} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2 text-orange-400" />
                  Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkDelete} className="cursor-pointer text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            disabled={tasks.length === 0}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9 md:h-10 text-xs md:text-sm"
          >
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            <span className="hidden md:inline">Export CSV</span>
            <span className="md:hidden">CSV</span>
          </Button>
          <Button 
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-neon-blue text-black font-black uppercase hover:bg-neon-blue/80 h-9 md:h-10 text-xs md:text-sm"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <TasksKPI analytics={analyticsData} isLoading={analyticsLoading} />

      {/* Filters */}
      <TasksFilters 
        filters={filters}
        setFilters={setFilters}
        employees={employees}
        onReset={handleResetFilters}
      />

      {/* Tasks Table */}
      <TasksTable
        tasks={tasks}
        isLoading={tasksLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onView={handleViewClick}
        selectedTasks={selectedTasks}
        onSelectTask={handleSelectTask}
        onSelectAll={handleSelectAll}
      />

      {/* Pagination */}
      {totalTasks > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, totalTasks)} of {totalTasks} tasks
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * 50 >= totalTasks}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskCreateModal 
        open={createModalOpen} 
        setOpen={setCreateModalOpen}
        onSuccess={refetchTasks}
      />

      <TaskEditModal 
        open={editModalOpen} 
        setOpen={setEditModalOpen}
        task={taskToEdit}
        onSuccess={refetchTasks}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
