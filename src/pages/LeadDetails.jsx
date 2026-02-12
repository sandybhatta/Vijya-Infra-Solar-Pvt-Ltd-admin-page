import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
    useGetLeadDetailsQuery, 
    useGetLeadHistoryQuery, 
    useUpdateLeadMutation, 
    useAddLeadNoteMutation,
    useGetLeadTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskStatusMutation
} from '@/features/leads/leadsApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    ArrowLeft, Phone, Mail, MapPin, Calendar, 
    MessageSquare, History, User, Edit3, 
    CheckCircle2, Clock, AlertCircle, FileText, 
    IndianRupee, TrendingUp, MoreVertical, Plus, 
    CheckSquare, BarChart2, Activity, Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export default function LeadDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role } = useSelector(state => state.auth)

    // --- QUERIES ---
    const { data: lead, isLoading: leadLoading } = useGetLeadDetailsQuery(id)
    const { data: history, isLoading: historyLoading } = useGetLeadHistoryQuery(id)
    const { data: tasks, isLoading: tasksLoading } = useGetLeadTasksQuery(id)

    // --- MUTATIONS ---
    const [updateLead] = useUpdateLeadMutation()
    const [addNote] = useAddLeadNoteMutation()
    const [createTask] = useCreateTaskMutation()
    const [updateTaskStatus] = useUpdateTaskStatusMutation()

    // --- LOCAL STATE ---
    const [activeTab, setActiveTab] = useState('overview')
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [statusData, setStatusData] = useState({ status: '', note: '' })
    const [taskData, setTaskData] = useState({ task_type: 'Follow-up', scheduled_date: '', remarks: '', priority: 'medium' })

    if (leadLoading) return (
        <div className="flex flex-col justify-center items-center h-screen bg-black gap-4">
            <div className="relative h-20 w-20">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-primary font-black uppercase text-xs tracking-widest animate-pulse italic">Synchronizing Data Streams...</p>
        </div>
    )

    if (!lead && !leadLoading) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white uppercase italic">Lead Record Not Found</h2>
            <p className="text-muted-foreground text-sm max-w-md">The requested record protocol could not be established. It may have been decommissioned or the UUID is invalid.</p>
            <Button onClick={() => navigate('/leads')} className="mt-4 bg-primary text-black">Return to Terminal</Button>
        </div>
    )

    const handleStatusUpdate = async () => {
        try {
            await updateLead({ id, status: statusData.status }).unwrap()
            await addNote({ 
                lead_id: id, 
                old_status: lead.status, 
                new_status: statusData.status, 
                note: statusData.note 
            }).unwrap()
            toast.success("Timeline Updated", { icon: '📅' })
            setIsStatusModalOpen(false)
        } catch (e) { toast.error("Transmission failed") }
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        try {
            await createTask({ ...taskData, lead_id: id }).unwrap()
            toast.success("Task Synchronized")
            setIsTaskModalOpen(false)
        } catch (e) { toast.error("System sync failed") }
    }

    const StatusBadge = ({ status }) => {
        const variants = {
            new: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
            contacted: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
            site_visit_done: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
            quotation_sent: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
            negotiation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
            converted: 'bg-green-500/20 text-green-400 border-green-500/20',
            rejected: 'bg-red-500/20 text-red-400 border-red-500/20'
        }
        return <Badge variant="outline" className={clsx("capitalize font-black italic text-[10px] px-3 py-0.5", variants[status])}>{status?.replace('_', ' ')}</Badge>
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
            {/* 1. TOP NAV & HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} className="text-muted-foreground hover:text-primary hover:bg-primary/5">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">{lead.name}</h1>
                            <StatusBadge status={lead.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                                <Clock className="h-3 w-3" /> UID: {lead.id.slice(0,8)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                                <Activity className="h-3 w-3" /> Captured: {format(new Date(lead.created_at), 'PPP')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-glass-border hover:bg-white/5 uppercase font-bold text-xs" onClick={() => window.open(`https://wa.me/${lead.phone_number}`)}>
                        <MessageSquare className="h-4 w-4 mr-2 text-green-500" /> WhatsApp
                    </Button>
                    <Button className="flex-1 md:flex-none bg-primary text-black hover:bg-primary/80 font-black uppercase italic text-xs tracking-widest" onClick={() => { setStatusData({ status: lead.status, note: '' }); setIsStatusModalOpen(true) }}>
                        Update Status
                    </Button>
                </div>
            </div>

            {/* 2. TABBED INTERFACE */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-glass-bg border border-glass-border p-1 gap-1">
                    {[
                        { id: 'overview', label: 'Summary', icon: User },
                        { id: 'timeline', label: 'History', icon: History },
                        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                        { id: 'quotations', label: 'Quotes', icon: FileText },
                    ].map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] uppercase font-black px-4 py-2 transition-all gap-2 italic">
                            <tab.icon className="h-3 w-3" /> {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* --- OVERVIEW TAB --- */}
                <TabsContent value="overview">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="bg-glass-bg border-glass-border">
                                <CardHeader className="border-b border-white/5 pb-4">
                                    <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 text-primary italic">
                                        <Zap className="h-4 w-4" /> Profile Intelligence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-black">Email Link</Label>
                                            <p className="text-white text-sm font-medium">{lead.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-black">Communication</Label>
                                            <p className="text-white text-sm font-medium">{lead.phone_number}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-black">Geographic Zone</Label>
                                            <p className="text-white text-sm font-medium">{lead.city}, {lead.state} {lead.pincode}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-black">Solar Preference</Label>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 uppercase font-black italic text-[10px]">{lead.solar_type || 'Custom'}</Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-black">Monthly Energy Consumption</Label>
                                            <p className="text-white text-sm font-medium italic underline decoration-primary/30">{lead.average_consumption_per_month || 0} kWh</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-black">Utility Company</Label>
                                            <p className="text-white text-sm font-medium opacity-70">{lead.electricity_distribution_company || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-glass-bg border-glass-border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">Lead Narrative</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl italic text-gray-400 text-sm leading-relaxed">
                                        "{lead.message || 'No initial message captured for this lead.'}"
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-primary/5 border border-primary/20">
                                <CardContent className="p-6 text-center space-y-4">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                                        <TrendingUp className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase italic">Pipeline Value</h3>
                                        <p className="text-2xl font-black text-primary italic">₹0.00</p>
                                        <p className="text-[9px] text-muted-foreground uppercase font-black mt-1">Based on accepted quotations</p>
                                    </div>
                                    <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10 uppercase font-black text-[10px] italic">Generate Quote</Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-glass-bg border-glass-border">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Lead Source</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Globe className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase italic">{lead.lead_sources?.name || 'Inbound Direct'}</p>
                                            <p className="text-[9px] text-muted-foreground uppercase font-black">Marketing Origin</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TIMELINE TAB --- */}
                <TabsContent value="timeline">
                    <Card className="bg-glass-bg border-glass-border">
                        <CardContent className="p-8">
                            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-white/10 ml-4">
                                {historyLoading ? <Loader2 className="animate-spin text-primary" /> : history?.map((item, idx) => (
                                    <div key={idx} className="relative pl-10 group">
                                        <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-stone-900 border-2 border-primary/50 group-hover:scale-120 transition-transform flex items-center justify-center">
                                            <div className="h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                                        </div>
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Badge variant="outline" className="text-[9px] uppercase font-black italic border-primary/20 text-primary mb-1">Status Shift</Badge>
                                                    <h4 className="text-sm font-bold text-white uppercase italic italic">
                                                        {item.old_status || 'Origin'} <span className="text-muted-foreground mx-2">→</span> {item.new_status}
                                                    </h4>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase bg-white/5 px-2 py-1 rounded">
                                                    {format(new Date(item.changed_at), 'MMM dd, HH:mm')}
                                                </span>
                                            </div>
                                            {item.note && (
                                                <p className="text-xs text-gray-400 italic bg-black/40 p-3 rounded-xl border-l-2 border-primary/50">
                                                    "{item.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!history || history.length === 0) && (
                                    <div className="text-center py-10 opacity-30 select-none">
                                        <Activity className="h-10 w-10 mx-auto mb-2" />
                                        <p className="text-xs uppercase font-black tracking-widest">No activity pulses detected</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TASKS TAB --- */}
                <TabsContent value="tasks" className="space-y-6">
                   <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Follow-up Protocols</h2>
                        <Button onClick={() => setIsTaskModalOpen(true)} className="bg-primary text-black font-black uppercase italic text-[10px] h-8 px-4">
                            + ADD PROTOCOL
                        </Button>
                   </div>
                   
                   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasksLoading ? <Loader2 className="animate-spin" /> : tasks?.map(task => (
                            <Card key={task.id} className={clsx("bg-glass-bg border-glass-border relative overflow-hidden group")}>
                                <div className={clsx("absolute top-0 right-0 p-1 rounded-bl-xl text-[8px] font-black uppercase text-black italic", 
                                    task.priority === 'urgent' ? 'bg-red-500' : 
                                    task.priority === 'high' ? 'bg-orange-500' : 'bg-primary'
                                )}>
                                    {task.priority}
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-white uppercase italic">{task.task_type}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                                                <Calendar className="h-3 w-3" /> {format(new Date(task.scheduled_date), 'PPP p')}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 italic h-8">
                                        "{task.remarks || 'No detailed instructions.'}"
                                    </p>
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                                        <span className={clsx("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", 
                                            task.status === 'completed' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                                        )}>
                                            {task.status}
                                        </span>
                                        {task.status !== 'completed' && (
                                            <Button size="sm" variant="ghost" className="h-6 text-[10px] uppercase font-black text-primary hover:text-white hover:bg-primary/20" onClick={() => updateTaskStatus({ id: task.id, status: 'completed' })}>
                                                Mark Done
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                   </div>
                   {(!tasks || tasks.length === 0) && !tasksLoading && (
                        <div className="text-center py-20 bg-glass-bg rounded-2xl border border-glass-border opacity-50">
                            <CheckSquare className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-xs uppercase font-black tracking-widest">No active follow-up tasks linked.</p>
                        </div>
                   )}
                </TabsContent>

                {/* --- QUOTATIONS TAB --- */}
                <TabsContent value="quotations">
                    <div className="text-center py-32 bg-glass-bg rounded-2xl border border-glass-border border-dashed border-primary/20">
                         <div className="max-w-xs mx-auto space-y-4">
                            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="h-8 w-8 text-primary opacity-50" />
                            </div>
                            <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">Empty Ledger</h3>
                            <p className="text-xs text-muted-foreground">No quotations have been issued for this lead yet. Start the conversion process by crafting a proposal.</p>
                            <Button className="w-full bg-primary text-black font-black uppercase italic tracking-widest text-xs py-6" onClick={() => navigate('/quotations/new?lead=' + id)}>
                                + CREATE FIRST QUOTE
                            </Button>
                         </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- MODALS --- */}
            
            {/* 1. Status Update Modal */}
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="bg-stone-950 border border-stone-800 text-white max-w-md p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-primary">Synchronize Lead Status</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs uppercase font-black mt-2">Adjust position in the sales funnel.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground">New Operational Status</Label>
                            <select 
                                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary uppercase font-bold italic" 
                                value={statusData.status} 
                                onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                            >
                                {['new','contacted','site_visit_done','quotation_sent','negotiation','converted', 'rejected'].map(s => (
                                    <option key={s} value={s} className="bg-stone-900">{s.replaceAll('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground">Timeline Log Note</Label>
                            <Input 
                                placeholder="Mandatory: Reasoning for status adjustment..."
                                value={statusData.note}
                                onChange={e => setStatusData({ ...statusData, note: e.target.value })}
                                className="bg-white/5 border-white/10 h-12"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsStatusModalOpen(false)} className="uppercase font-black text-[10px] tracking-widest">Abort</Button>
                        <Button onClick={handleStatusUpdate} disabled={!statusData.note} className="bg-primary text-black font-black uppercase italic tracking-widest text-[10px] px-8">Confirm Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Create Task Modal */}
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogContent className="bg-stone-950 border border-stone-800 text-white max-w-md p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-primary">New Protocol Link</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground">Task Protocol Level</Label>
                            <select 
                                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary uppercase font-bold italic" 
                                value={taskData.task_type} 
                                onChange={(e) => setTaskData({ ...taskData, task_type: e.target.value })}
                            >
                                {['Follow-up','Site Visit','Call','Meeting','Document Collection'].map(s => (
                                    <option key={s} value={s} className="bg-stone-900">{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Priority Zone</Label>
                                <select 
                                    className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary uppercase font-bold italic" 
                                    value={taskData.priority} 
                                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                                >
                                    {['low', 'medium', 'high', 'urgent'].map(s => (
                                        <option key={s} value={s} className="bg-stone-900">{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Phase Target Date</Label>
                                <Input 
                                    type="datetime-local"
                                    value={taskData.scheduled_date}
                                    onChange={e => setTaskData({ ...taskData, scheduled_date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-xs"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground">Protocol Remarks</Label>
                            <Input 
                                placeholder="Specific instructions for this cycle..."
                                value={taskData.remarks}
                                onChange={e => setTaskData({ ...taskData, remarks: e.target.value })}
                                className="bg-white/5 border-white/10 h-12"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-primary text-black font-black uppercase italic tracking-widest text-[10px] py-6">Initiate Protocol</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
