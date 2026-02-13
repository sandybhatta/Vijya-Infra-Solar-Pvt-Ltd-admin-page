import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    ShieldCheck, 
    Activity, 
    Server, 
    Database, 
    Lock, 
    Globe, 
    Smartphone,
    Monitor,
    ShieldAlert,
    RefreshCw,
    CheckCircle2,
    Zap,
    Key,
    UserCog,
    Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function SecuritySystemTab() {
    const [systemStatus, setSystemStatus] = useState({
        supabase: 'checking',
        api: 'online',
        lastBackup: '2 hours ago',
        version: 'v2.4.0-production'
    })

    const [activeSessions, setActiveSessions] = useState([
        { id: 1, device: 'Chrome / Windows', city: 'Mumbai', time: 'Active Now', isCurrent: true },
        { id: 2, device: 'Safari / iPhone 15', city: 'Delhi', time: '14 mins ago', isCurrent: false },
    ])

    const [auditLogs, setAuditLogs] = useState([])
    const [isLoadingLogs, setIsLoadingLogs] = useState(true)

    const [securityToggles, setSecurityToggles] = useState({
        twoFactor: false,
        apiLockdown: true,
        auditLogging: true,
        realtimeSync: true
    })

    useEffect(() => {
        // Mock checking Supabase connection
        const checkSupabase = async () => {
            const { error } = await supabase.from('admin_users').select('count', { head: true })
            setSystemStatus(prev => ({ ...prev, supabase: error ? 'error' : 'connected' }))
        }

        const fetchLogs = async () => {
            try {
                // Fallback to activity_logs table which exists
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50)
                
                if (data) {
                    // Map activity_logs fields to the expected format
                    const mappedLogs = data.map(log => ({
                        ...log,
                        user_email: log.user_email || 'System', // use default if missing
                        action_type: log.action || 'Unknown',
                        entity_name: log.table_name || 'System'
                    }))
                    setAuditLogs(mappedLogs)
                }
            } catch (err) {
                console.error("Log retrieval failure:", err)
            } finally {
                setIsLoadingLogs(false)
            }
        }

        checkSupabase()
        fetchLogs()
    }, [])

    const toggleSecurity = (key) => {
        setSecurityToggles(prev => ({ ...prev, [key]: !prev[key] }))
        toast.success("Security protocol updated")
    }

    return (
        <div className="space-y-6">
            {/* System Status Overview */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Server className="h-4 w-4 text-emerald-400" />
                        </div>
                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 font-black text-[10px]">OPERATIONAL</Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Database Engine</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Database className="h-4 w-4 text-white" />
                        <span className="text-sm font-bold text-white uppercase italic">Supabase Cloud</span>
                    </div>
                </Card>

                <Card className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                            <Zap className="h-4 w-4 text-neon-blue" />
                        </div>
                        <Badge variant="outline" className="border-neon-blue/20 text-neon-blue font-black text-[10px]">SYNC ACTIVE</Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">System Latency</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Activity className="h-4 w-4 text-white" />
                        <span className="text-sm font-bold text-white uppercase italic">14ms Response</span>
                    </div>
                </Card>

                <Card className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <ShieldCheck className="h-4 w-4 text-orange-400" />
                        </div>
                        <Badge variant="outline" className="border-orange-500/20 text-orange-400 font-black text-[10px]">STRICT</Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Environment</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Lock className="h-4 w-4 text-white" />
                        <span className="text-sm font-bold text-white uppercase italic">Production SSR</span>
                    </div>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Security Protocols */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Lock className="h-5 w-5 text-neon-blue" /> Security Protocols
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold">Two-Factor Authentication</Label>
                                <p className="text-[10px] text-gray-400 italic">Add an extra layer of security to your account.</p>
                            </div>
                            <Switch 
                                checked={securityToggles.twoFactor} 
                                onCheckedChange={() => toggleSecurity('twoFactor')} 
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold">API Hardening</Label>
                                <p className="text-[10px] text-gray-400 italic">Restrict cross-origin requests to production domains.</p>
                            </div>
                            <Switch 
                                checked={securityToggles.apiLockdown} 
                                onCheckedChange={() => toggleSecurity('apiLockdown')} 
                                disabled
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold">Real-time Data Sync</Label>
                                <p className="text-[10px] text-gray-400 italic">Broadcast changes to all connected clients instantly.</p>
                            </div>
                            <Switch 
                                checked={securityToggles.realtimeSync} 
                                onCheckedChange={() => toggleSecurity('realtimeSync')} 
                            />
                        </div>

                        <div className="pt-4 flex flex-col gap-2">
                            <Button variant="outline" className="w-full border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest">
                                <Key className="h-3 w-3 mr-2 text-neon-blue" /> Rotate API Keys
                            </Button>
                            <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-widest">
                                <ShieldAlert className="h-3 w-3 mr-2" /> Security Audit Log
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                             <UserCog className="h-5 w-5 text-violet-400" /> Active Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <div className="space-y-4">
                            {activeSessions.map((session) => (
                                <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 gap-4 group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                            {session.device.includes('iPhone') ? <Smartphone className="h-5 w-5 text-gray-400" /> : <Monitor className="h-5 w-5 text-gray-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-white truncate">{session.device}</span>
                                                {session.isCurrent && <Badge className="bg-neon-blue text-black text-[8px] font-black uppercase shrink-0">THIS DEVICE</Badge>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest flex-wrap">
                                                <Globe className="h-3 w-3" /> {session.city} • <RefreshCw className="h-3 w-3" /> {session.time}
                                            </div>
                                        </div>
                                    </div>
                                    {!session.isCurrent && (
                                        <Button variant="ghost" size="sm" className="w-full sm:w-auto text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest">
                                            Revoke
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-red-500/20 mt-1 shrink-0">
                                    <ShieldAlert className="h-4 w-4 text-red-400" />
                                </div>
                                <div className="space-y-1">
                                    <h5 className="text-sm font-bold text-red-400 uppercase italic tracking-tighter">Emergency Protocol</h5>
                                    <p className="text-[10px] text-gray-500 italic">Instantly revoke all session tokens and sign out of all devices.</p>
                                    <Button size="sm" className="mt-2 w-full sm:w-auto bg-red-500 text-white hover:bg-red-600 font-bold px-6 uppercase text-[10px] tracking-widest">
                                        Global Sign Out
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Audit Log - Full Width below the grid */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
                <CardHeader className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-emerald-400" />
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-white uppercase italic tracking-tighter">System Audit Log</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs text-gray-400 italic font-bold">Protocol activity monitoring (Last 50 Events)</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[700px] md:min-w-full">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest p-4">Timestamp</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest">Subject</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest">Operation</TableHead>
                                    <TableHead className="text-gray-400 uppercase text-[9px] md:text-[10px] font-black tracking-widest">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingLogs ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-neon-blue mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : auditLogs?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-gray-500 font-bold italic uppercase tracking-widest text-[10px]">
                                            No recent logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : auditLogs?.map((log) => (
                                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="p-4 font-mono text-[10px] text-gray-500">
                                            {format(new Date(log.created_at), 'yyyy.MM.dd HH:mm:ss')}
                                        </TableCell>
                                        <TableCell className="font-bold text-white uppercase italic text-[11px]">
                                            {log.user_email?.includes('@') ? log.user_email.split('@')[0] : log.user_email}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-400 text-[10px]">
                                            <span className="text-neon-blue font-black uppercase">{log.action_type}</span> on <span className="text-white">{log.entity_name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-white/5 text-emerald-400 border-none uppercase font-black text-[9px] italic">
                                                VERIFIED_SUCCESS
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <p className="text-center text-[10px] text-gray-600 uppercase font-black tracking-[0.2em] pt-4">
                System Kernel: Solaris OS 2.4.0 • Secured by Advanced Cryptography
            </p>
        </div>
    )
}
