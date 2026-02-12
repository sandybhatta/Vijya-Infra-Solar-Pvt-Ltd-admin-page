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
import { Search, X, Filter, Calendar as CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function InvoiceFiltersBar({ 
  filters, 
  setFilters, 
  projects = [],
  onReset 
}) {
  const paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Amount' },
    { value: 'lowest', label: 'Lowest Amount' },
    { value: 'overdue', label: 'Overdue First' }
  ]

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.projectId,
    filters.city,
    filters.state,
    filters.invoiceDateFrom,
    filters.invoiceDateTo,
    filters.dueDateFrom,
    filters.dueDateTo
  ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Search Bar - Full Width on Mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by invoice number, customer name, phone..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="pl-10 bg-white/5 border-white/10 text-white h-10 md:h-12"
        />
      </div>

      {/* Filter Grid - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
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
            {paymentStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project Filter */}
        <Select 
          value={filters.projectId || 'all'} 
          onValueChange={(val) => setFilters({ ...filters, projectId: val === 'all' ? '' : val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Input
          placeholder="City"
          value={filters.city || ''}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm"
        />

        {/* State Filter */}
        <Input
          placeholder="State"
          value={filters.state || ''}
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm"
        />

        {/* Sort Dropdown */}
        <Select 
          value={filters.sortBy || 'newest'} 
          onValueChange={(val) => setFilters({ ...filters, sortBy: val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white">
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9 md:h-10 text-xs md:text-sm"
          >
            <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Reset</span>
            <span className="md:hidden">Clear</span>
          </Button>
        )}
      </div>

      {/* Date Range Filters - Collapsible */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white">
          <CalendarIcon className="h-4 w-4" />
          <span>Date Range Filters</span>
          <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {/* Invoice Date From */}
          <div className="space-y-1">
            <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">
              Invoice From
            </label>
            <Input
              type="date"
              value={filters.invoiceDateFrom || ''}
              onChange={(e) => setFilters({ ...filters, invoiceDateFrom: e.target.value })}
              className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm"
            />
          </div>

          {/* Invoice Date To */}
          <div className="space-y-1">
            <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">
              Invoice To
            </label>
            <Input
              type="date"
              value={filters.invoiceDateTo || ''}
              onChange={(e) => setFilters({ ...filters, invoiceDateTo: e.target.value })}
              className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm"
            />
          </div>

          {/* Due Date From */}
          <div className="space-y-1">
            <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">
              Due From
            </label>
            <Input
              type="date"
              value={filters.dueDateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
              className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm"
            />
          </div>

          {/* Due Date To */}
          <div className="space-y-1">
            <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">
              Due To
            </label>
            <Input
              type="date"
              value={filters.dueDateTo || ''}
              onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
              className="bg-white/5 border-white/10 text-white h-9 md:h-10 text-xs md:text-sm"
            />
          </div>
        </div>
      </details>

      {/* Active Filters Badge */}
      {activeFiltersCount > 0 && (
        <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
          <Filter className="h-3 w-3 mr-1" />
          {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
        </Badge>
      )}
    </div>
  )
}
