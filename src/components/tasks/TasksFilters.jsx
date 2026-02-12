import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Search, X, Filter, AlertCircle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function TasksFilters({ 
  filters, 
  setFilters, 
  employees = [], 
  onReset 
}) {
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

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.taskType,
    filters.employeeId,
    filters.onlyOverdue,
    filters.onlyToday
  ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Search Bar - Full Width on Mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks, employees, remarks..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="pl-10 bg-white/5 border-white/10 text-white h-10 md:h-12"
        />
      </div>

      {/* Filter Grid - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
        {/* Status Filter */}
        <Select 
          value={filters.status || 'all'} 
          onValueChange={(val) => setFilters({ ...filters, status: val === 'all' ? '' : val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white">
            <SelectItem value="all">All Status</SelectItem>
            {taskStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Task Type Filter */}
        <Select 
          value={filters.taskType || 'all'} 
          onValueChange={(val) => setFilters({ ...filters, taskType: val === 'all' ? '' : val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white">
            <SelectItem value="all">All Types</SelectItem>
            {taskTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employee Filter */}
        <Select 
          value={filters.employeeId || 'all'} 
          onValueChange={(val) => setFilters({ ...filters, employeeId: val === 'all' ? '' : val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white">
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Overdue Toggle */}
        <Button
          variant={filters.onlyOverdue ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ ...filters, onlyOverdue: !filters.onlyOverdue })}
          className={`h-9 md:h-10 text-xs md:text-sm ${
            filters.onlyOverdue 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden md:inline">Overdue</span>
          <span className="md:hidden">Over</span>
        </Button>

        {/* Today Toggle */}
        <Button
          variant={filters.onlyToday ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ ...filters, onlyToday: !filters.onlyToday })}
          className={`h-9 md:h-10 text-xs md:text-sm ${
            filters.onlyToday 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden md:inline">Today</span>
          <span className="md:hidden">Now</span>
        </Button>
      </div>

      {/* Active Filters & Reset */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
            <Filter className="h-3 w-3 mr-1" />
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}
