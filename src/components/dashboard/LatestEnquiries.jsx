import React, { useState } from 'react'
import { useGetLatestUsersQuery } from '@/features/users/usersApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Loader2, Eye, User, Mail, Phone, MapPin, Zap, MessageSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const LatestEnquiries = () => {
  const { data: usersData, isLoading, isError } = useGetLatestUsersQuery()
  const users = usersData?.users || []
  const [searchTerm, setSearchTerm] = useState('')
  const [solarFilter, setSolarFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const navigate = useNavigate()

  // Local filtering with useMemo
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number?.includes(searchTerm)
      
      const matchesSolar = solarFilter === 'all' || user.solar_type === solarFilter

      return matchesSearch && matchesSolar
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [users, searchTerm, solarFilter])

  if (isLoading) {
    return (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle>Latest Website Enquiries</CardTitle>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="w-full mt-6 border-red-200 bg-red-50">
        <CardContent className="pt-6 text-red-600 text-center">
          Failed to load enquiries. Please try again.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mt-6 shadow-md border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            📩 Latest Website Enquiries
            <Badge variant="secondary" className="ml-2 font-normal text-xs animate-pulse">Realtime</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Most recent form submissions from the website</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
          View All Enquiries
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={solarFilter} onValueChange={setSolarFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by Solar Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Agricultural">Agricultural</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Solar Type</TableHead>
                <TableHead>Consumption</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No enquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(user.created_at), 'dd MMM yyyy')}<br/>
                      {format(new Date(user.created_at), 'hh:mm a')}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                        <span className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {user.phone_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.city}, {user.state}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.solar_type || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.average_consumption_per_month}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {user.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                          <SheetHeader>
                            <SheetTitle>Enquiry Details</SheetTitle>
                            <SheetDescription>
                              Submitted on {format(new Date(user.created_at), 'PPP at pp')}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="grid gap-6 py-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" /> Personal Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Name</label>
                                        <p className="font-medium">{user.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Phone</label>
                                        <p className="font-medium">{user.phone_number}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-muted-foreground">Email</label>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" /> Location & Utility
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                                    <div>
                                        <label className="text-xs text-muted-foreground">City</label>
                                        <p className="font-medium">{user.city}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">State</label>
                                        <p className="font-medium">{user.state}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Pincode</label>
                                        <p className="font-medium">{user.pincode}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-muted-foreground">Electricity Provider</label>
                                        <p className="font-medium">{user.electricity_distribution_company}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" /> Solar Requirements
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Solar Type</label>
                                        <p className="font-medium">{user.solar_type}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Avg. Consumption</label>
                                        <p className="font-medium">{user.average_consumption_per_month}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" /> Message
                                </h3>
                                <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                                    {user.message}
                                </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {filteredUsers.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No enquiries found.</div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(user.created_at), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                    <Badge variant="outline">{user.solar_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{user.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{user.city}, {user.state}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm bg-muted/50 p-2 rounded line-clamp-2">
                    {user.message}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <div className="text-xs text-muted-foreground">
                        <Zap className="h-3 w-3 inline mr-1" />
                        {user.average_consumption_per_month}
                    </div>
                    
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedUser(user)}>
                                View Details
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh]">
                            {/* Same sheet content structure as desktop, simplified if needed */}
                            <SheetHeader>
                                <SheetTitle>Enquiry Details</SheetTitle>
                                <SheetDescription>
                                    Submitted on {format(new Date(user.created_at), 'PPP at pp')}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-6 py-6 overflow-y-auto max-h-[70vh]">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" /> Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 border p-4 rounded-lg bg-muted/20">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Name</label>
                                            <p className="font-medium">{user.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Phone</label>
                                            <p className="font-medium">{user.phone_number}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Email</label>
                                            <p className="font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" /> Location & Utility
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 border p-4 rounded-lg bg-muted/20">
                                        <div>
                                            <label className="text-xs text-muted-foreground">City</label>
                                            <p className="font-medium">{user.city}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">State</label>
                                            <p className="font-medium">{user.state}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Pincode</label>
                                            <p className="font-medium">{user.pincode}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Electricity Provider</label>
                                            <p className="font-medium">{user.electricity_distribution_company}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" /> Solar Requirements
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 border p-4 rounded-lg bg-muted/20">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Solar Type</label>
                                            <p className="font-medium">{user.solar_type}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Avg. Consumption</label>
                                            <p className="font-medium">{user.average_consumption_per_month}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" /> Message
                                    </h3>
                                    <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                                        {user.message}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default LatestEnquiries
