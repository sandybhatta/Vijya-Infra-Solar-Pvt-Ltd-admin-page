import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  useGetUsersQuery, 
  useDeleteUserMutation
} from '@/features/users/usersApi'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Loader2, 
  Search, 
  Download, 
  Trash2, 
  MoreHorizontal, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Zap,
  Eye,
  MessageSquare,
  Globe,
  User
} from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Users() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [solarFilter, setSolarFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Auth role check
  const { role } = useSelector((state) => state.auth)
  const isAdmin = role === 'admin'

  const { data, isLoading, isFetching, isError, error } = useGetUsersQuery({
    page,
    limit,
    search: searchTerm,
    solarType: solarFilter
  })

  const [deleteUser] = useDeleteUserMutation()

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page on search
  }

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error("Only Admins can delete enquiries")
      return
    }
    if (confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      const { error } = await deleteUser(id)
      if (error) toast.error(`Failed to delete: ${error}`)
      else toast.success('Enquiry deleted successfully')
    }
  }

  const exportCSV = () => {
    if (!data?.users) return
    
    // Fetch ALL users for export? Ideally yes, but current API paginates.
    // For now, export current view or we need an endpoint for "getAll".
    // We'll export current view for simplicity as "Export Page".
    // Or we could trigger a separate fetch for all.
    // Let's just export current page data to CSV.
    
    const headers = ['Date', 'Name', 'Email', 'Phone', 'City', 'State', 'Solar Type', 'Consumption', 'Message']
    const csvContent = [
      headers.join(','),
      ...data.users.map(u => [
        format(new Date(u.created_at), 'yyyy-MM-dd HH:mm'),
        `"${u.name}"`,
        u.email,
        u.phone_number,
        `"${u.city}"`,
        `"${u.state}"`,
        u.solar_type,
        u.average_consumption_per_month,
        `"${u.message?.replace(/"/g, '""')}"` // Escape quotes
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `enquiries_export_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Website Enquiries</h2>
          <p className="text-muted-foreground">Manage leads and form submissions from the website.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Select value={solarFilter} onValueChange={(val) => { setSolarFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Solar Type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Solar Types</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Agricultural">Agricultural</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Solar Req</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                  Error loading enquiries: {error?.message || 'Unknown error'}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No enquiries found.
                </TableCell>
              </TableRow>
            ) : (
              data?.users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex flex-col">
                        <span>{format(new Date(user.created_at), 'MMM dd, yyyy')}</span>
                        <span className="text-xs">{format(new Date(user.created_at), 'hh:mm a')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {user.phone_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /> {user.city}, {user.state}</div>
                        <div className="text-xs text-muted-foreground mt-1">{user.electricity_distribution_company}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                        <Badge variant="outline" className="mb-1">{user.solar_type}</Badge>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {user.average_consumption_per_month}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <DetailContent user={user} />
                      </Sheet>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                            Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isAdmin && (
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(user.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {data?.users?.length === 0 && !isLoading && !isError && (
          <div className="text-center py-8 text-muted-foreground bg-card border rounded-lg">
            No enquiries found.
          </div>
        )}
        {data?.users?.map((user) => (
          <Card key={user.id} className="p-4 space-y-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(user.created_at), 'MMM dd, yyyy • hh:mm a')}
                </p>
              </div>
              <Badge variant="outline">{user.solar_type}</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {user.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {user.phone_number}</div>
                <div className="flex items-center gap-2 font-medium text-primary"><MapPin className="h-4 w-4" /> {user.city}, {user.state}</div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" /> View Details
                  </Button>
                </SheetTrigger>
                <DetailContent user={user} />
              </Sheet>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>Copy Email</DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(user.id)}>Delete</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data?.total > limit && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// Separate component for Sheet content for better organization
const DetailContent = ({ user }) => (
    <SheetContent className="w-[100%] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Enquiry Details
            </SheetTitle>
            <SheetDescription>
                Submitted on {format(new Date(user.created_at), 'PPP at pp')}
            </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Full Name</p>
                        <p className="font-semibold">{user.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                        <p className="font-semibold">{user.phone_number}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                        <p className="font-semibold">{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location Details
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">City</p>
                        <p className="font-semibold">{user.city}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">State</p>
                        <p className="font-semibold">{user.state}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-muted-foreground font-medium">Pincode</p>
                        <p className="font-semibold">{user.pincode}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Utility & Solar Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="md:col-span-2 text-primary">
                        <p className="text-xs text-muted-foreground font-medium">Electricity Provider</p>
                        <p className="font-semibold">{user.electricity_distribution_company}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Solar Type</p>
                        <Badge className="mt-1 font-bold">{user.solar_type}</Badge>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Avg. Consumption</p>
                        <p className="font-semibold">{user.average_consumption_per_month}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Customer Message
                </h3>
                <div className="bg-muted p-4 rounded-lg text-sm border italic leading-relaxed whitespace-pre-wrap">
                    "{user.message}"
                </div>
            </div>
        </div>
    </SheetContent>
)

const Card = ({ children, className }) => (
  <div className={`bg-card rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
)
