import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

export default function ExpenseFiltersBar({ filters, setFilters, categories, projects, onReset }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const debouncedSearch = useDebounce(localSearch, 500)

  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }))
  }, [debouncedSearch, setFilters])

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search expenses..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <Select
          value={filters.categoryId}
          onValueChange={(val) => setFilters({ ...filters, categoryId: val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white">
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(val) => setFilters({ ...filters, sortBy: val })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10 text-white">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Amount</SelectItem>
            <SelectItem value="lowest">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-neon-blue hover:text-neon-blue/80 hover:bg-white/5"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          Reset All
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10">
          {/* Project Filter */}
          <Select
            value={filters.projectId}
            onValueChange={(val) => setFilters({ ...filters, projectId: val })}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10 text-white max-h-60">
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map(proj => (
                <SelectItem key={proj.id} value={proj.id}>{proj.project_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Expense Type */}
          <Select
            value={filters.expenseType}
            onValueChange={(val) => setFilters({ ...filters, expenseType: val })}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="project">Project Expenses</SelectItem>
              <SelectItem value="general">General Expenses</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range From */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">From Date</label>
            <Input
              type="date"
              value={filters.expenseDateFrom}
              onChange={(e) => setFilters({ ...filters, expenseDateFrom: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Date Range To */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">To Date</label>
            <Input
              type="date"
              value={filters.expenseDateTo}
              onChange={(e) => setFilters({ ...filters, expenseDateTo: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Amount Min */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Min Amount (₹)</label>
            <Input
              type="number"
              value={filters.amountMin}
              onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
              placeholder="0"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Amount Max */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Max Amount (₹)</label>
            <Input
              type="number"
              value={filters.amountMax}
              onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
              placeholder="999999"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}
