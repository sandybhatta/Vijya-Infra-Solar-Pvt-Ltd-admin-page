import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Loader2, Eye, User, Mail, Phone, MapPin, Zap, MessageSquare, Calendar, X, TrendingUp, Building } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

const LatestEnquiries = () => {
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [solarFilter, setSolarFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const navigate = useNavigate()

  // Fetch leads from leads table
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('leads')
          .select(`
            *,
            lead_sources(name),
            marketing_campaigns(name)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setLeads(data || [])
        setIsError(false)
      } catch (error) {
        console.error('Error fetching leads:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()

    // Real-time subscription for new leads
    const subscription = supabase
      .channel('leads-enquiries')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [payload.new, ...prev].slice(0, 50))
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(lead => 
            lead.id === payload.new.id ? payload.new : lead
          ))
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(lead => lead.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  // Local filtering with useMemo
  const filteredLeads = React.useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_number?.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSolar = solarFilter === 'all' || lead.solar_type === solarFilter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter

      return matchesSearch && matchesSolar && matchesStatus
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [leads, searchTerm, solarFilter, statusFilter])

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
          <p className="text-sm text-muted-foreground">Most recent lead submissions from the website</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
          View All Enquiries
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or city..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No enquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), 'dd MMM yyyy')}<br/>
                      {format(new Date(lead.created_at), 'hh:mm a')}
                    </TableCell>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                        <span className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {lead.phone_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.city}, {lead.state}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.solar_type || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="capitalize">
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.lead_sources?.name || 'Direct'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet open={isSheetOpen && selectedLead?.id === lead.id} onOpenChange={(open) => {
                        setIsSheetOpen(open)
                        if (!open) setSelectedLead(null)
                      }}>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setSelectedLead(lead)
                            setIsSheetOpen(true)
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                          <SheetHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <SheetTitle>Lead Details</SheetTitle>
                                <SheetDescription>
                                  Submitted on {format(new Date(lead.created_at), 'PPP at pp')}
                                </SheetDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full"
                                onClick={() => setIsSheetOpen(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </SheetHeader>
                          <div className="grid gap-6 py-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" /> Personal Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Name</label>
                                        <p className="font-medium">{lead.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Phone</label>
                                        <p className="font-medium">{lead.phone_number}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-muted-foreground">Email</label>
                                        <p className="font-medium">{lead.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Status</label>
                                        <Badge variant="outline" className="capitalize">{lead.status}</Badge>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Source</label>
                                        <p className="font-medium">{lead.lead_sources?.name || 'Direct'}</p>
                                    </div>
                                    {lead.campaign_id && (
                                      <div className="col-span-2">
                                          <label className="text-xs text-muted-foreground">Campaign</label>
                                          <p className="font-medium">{lead.marketing_campaigns?.name || 'N/A'}</p>
                                      </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" /> Location & Utility
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                                    <div>
                                        <label className="text-xs text-muted-foreground">City</label>
                                        <p className="font-medium">{lead.city}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">State</label>
                                        <p className="font-medium">{lead.state}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Pincode</label>
                                        <p className="font-medium">{lead.pincode}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-muted-foreground">Electricity Provider</label>
                                        <p className="font-medium">{lead.electricity_distribution_company || 'N/A'}</p>
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
                                        <p className="font-medium">{lead.solar_type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Avg. Consumption</label>
                                        <p className="font-medium">{lead.average_consumption_per_month || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {lead.message && (
                              <div className="space-y-2">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                      <MessageSquare className="h-5 w-5 text-primary" /> Message
                                  </h3>
                                  <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                                      {lead.message}
                                  </div>
                              </div>
                            )}
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
          {filteredLeads.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No enquiries found.</div>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{lead.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lead.created_at), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">{lead.solar_type || 'N/A'}</Badge>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="capitalize text-xs">
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{lead.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{lead.city}, {lead.state}</span>
                    </div>
                  </div>
                  
                  {lead.message && (
                    <div className="text-sm bg-muted/50 p-2 rounded line-clamp-2">
                      {lead.message}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <div className="text-xs text-muted-foreground">
                        <Zap className="h-3 w-3 inline mr-1" />
                        {lead.average_consumption_per_month || 'N/A'}
                    </div>
                    
                    <Sheet open={isSheetOpen && selectedLead?.id === lead.id} onOpenChange={(open) => {
                      setIsSheetOpen(open)
                      if (!open) setSelectedLead(null)
                    }}>
                        <SheetTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setSelectedLead(lead)
                              setIsSheetOpen(true)
                            }}>
                                View Details
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh]">
                            <SheetHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <SheetTitle>Lead Details</SheetTitle>
                                    <SheetDescription>
                                        Submitted on {format(new Date(lead.created_at), 'PPP at pp')}
                                    </SheetDescription>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-full"
                                    onClick={() => setIsSheetOpen(false)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                            </SheetHeader>
                            <div className="grid gap-6 py-6 overflow-y-auto max-h-[70vh]">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" /> Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 border p-4 rounded-lg bg-muted/20">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Name</label>
                                            <p className="font-medium">{lead.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Phone</label>
                                            <p className="font-medium">{lead.phone_number}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Email</label>
                                            <p className="font-medium">{lead.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Status</label>
                                            <Badge variant="outline" className="capitalize">{lead.status}</Badge>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Source</label>
                                            <p className="font-medium">{lead.lead_sources?.name || 'Direct'}</p>
                                        </div>
                                        {lead.campaign_id && (
                                          <div>
                                              <label className="text-xs text-muted-foreground">Campaign</label>
                                              <p className="font-medium">{lead.marketing_campaigns?.name || 'N/A'}</p>
                                          </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" /> Location & Utility
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 border p-4 rounded-lg bg-muted/20">
                                        <div>
                                            <label className="text-xs text-muted-foreground">City</label>
                                            <p className="font-medium">{lead.city}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">State</label>
                                            <p className="font-medium">{lead.state}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Pincode</label>
                                            <p className="font-medium">{lead.pincode}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Electricity Provider</label>
                                            <p className="font-medium">{lead.electricity_distribution_company || 'N/A'}</p>
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
                                            <p className="font-medium">{lead.solar_type || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Avg. Consumption</label>
                                            <p className="font-medium">{lead.average_consumption_per_month || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                {lead.message && (
                                  <div className="space-y-2">
                                      <h3 className="font-semibold text-lg flex items-center gap-2">
                                          <MessageSquare className="h-5 w-5 text-primary" /> Message
                                      </h3>
                                      <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                                          {lead.message}
                                      </div>
                                  </div>
                                )}
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

