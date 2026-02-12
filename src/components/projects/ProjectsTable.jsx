import React, { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  ChevronDown, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Filter,
  Columns
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { Checkbox } from "@/components/ui/checkbox"

export default function ProjectsTable({ data, onEdit, onDelete, isLoading }) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-white/20 data-[state=checked]:bg-neon-blue data-[state=checked]:text-black"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-white/20 data-[state=checked]:bg-neon-blue data-[state=checked]:text-black"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "project_name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-bold">
          PROJECT NAME <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link to={`/projects/${row.original.id}`} className="font-black text-neon-blue hover:underline decoration-neon-blue/40 underline-offset-4 uppercase tracking-tight">
            {row.getValue("project_name")}
          </Link>
          <span className="text-[10px] text-gray-500 font-bold uppercase">{row.original.leads?.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "project_status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("project_status")
        const variants = {
          ongoing: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20",
          completed: "bg-neon-green/10 text-neon-green border-neon-green/20",
          cancelled: "bg-red-500/10 text-red-500 border-red-500/20"
        }
        return (
          <Badge className={clsx("capitalize font-black text-[10px]", variants[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "capacity_kw",
      header: "CAPACITY",
      cell: ({ row }) => <div className="font-mono text-neon-cyan">{row.getValue("capacity_kw")} kW</div>,
    },
    {
      accessorKey: "total_invoiced",
      header: "INVOICED",
      cell: ({ row }) => <div className="font-mono text-white">${row.original.total_invoiced?.toLocaleString()}</div>,
    },
    {
      accessorKey: "total_paid",
      header: "PAID",
      cell: ({ row }) => (
        <div className="space-y-1.5 min-w-[120px]">
          <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
             <span>${row.original.total_paid?.toLocaleString()}</span>
             <span>{Math.round((row.original.total_paid / (row.original.total_invoiced || 1)) * 100)}%</span>
          </div>
          <Progress 
            value={(row.original.total_paid / (row.original.total_invoiced || 1)) * 100} 
            className="h-1 bg-white/5" 
            indicatorClassName="bg-neon-blue"
          />
        </div>
      ),
    },
    {
        accessorKey: "net_profit",
        header: "NET PROFIT",
        cell: ({ row }) => {
            const profit = row.original.net_profit
            return (
                <div className={clsx("font-mono font-bold", profit >= 0 ? "text-neon-green" : "text-red-500")}>
                    {profit < 0 ? '-' : ''}${Math.abs(profit)?.toLocaleString()}
                </div>
            )
        }
    },
    {
        id: "margin",
        header: "MARGIN",
        cell: ({ row }) => {
            const margin = row.original.profit_margin || 0
            let color = "text-red-500"
            let label = "Loss"
            
            if (margin > 30) { color = "text-neon-green"; label = "Excellent" }
            else if (margin > 15) { color = "text-neon-cyan"; label = "Good" }
            else if (margin > 0) { color = "text-neon-yellow"; label = "Risky" }

            return (
                <div className="flex flex-col">
                    <span className={clsx("font-black text-sm", color)}>{margin.toFixed(1)}%</span>
                    <span className="text-[9px] uppercase font-bold text-gray-500">{label}</span>
                </div>
            )
        }
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-glass-bg border-glass-border text-white backdrop-blur-xl">
            <DropdownMenuLabel className="text-gray-400 text-xs uppercase font-bold tracking-widest">Operations</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/projects/${row.original.id}`)} className="focus:bg-white/10 focus:text-neon-blue cursor-pointer">
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)} className="focus:bg-white/10 focus:text-neon-yellow cursor-pointer">
              <Edit className="mr-2 h-4 w-4" /> Edit Project
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate, onEdit, onDelete])

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Input
            placeholder="Search projects..."
            value={(table.getColumn("project_name")?.getFilterValue()) ?? ""}
            onChange={(event) =>
              table.getColumn("project_name")?.setFilterValue(event.target.value)
            }
            className="bg-white/5 border-white/10 text-white pl-10 h-10 ring-neon-blue/20"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-gray-400 h-10 px-4">
                        <Columns className="mr-2 h-4 w-4" /> View Options
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-glass-bg border-glass-border text-white">
                    {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                        return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize focus:bg-white/10"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                            {column.id.replace('_', ' ')}
                        </DropdownMenuCheckboxItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="border-white/10 bg-white/5 text-gray-400 h-10 px-4">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-glass-bg overflow-hidden relative">
        {isLoading && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center text-neon-blue font-black animate-pulse">SYNCING DATA...</div>}
        <Table>
          <TableHeader className="bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/5 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-400 text-[10px] font-black uppercase tracking-widest py-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500 font-bold uppercase tracking-widest">
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-white/10 bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 h-8"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-white/10 bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 h-8"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
