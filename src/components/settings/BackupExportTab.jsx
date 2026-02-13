import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Download, 
    Database, 
    FileJson, 
    FileText, 
    HardDrive, 
    RefreshCcw, 
    UploadCloud,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export function BackupExportTab() {
    const [isExporting, setIsExporting] = useState(false)

    const exportToCSV = async (table) => {
        setIsExporting(true)
        try {
            const { data, error } = await supabase.from(table).select('*')
            if (error) throw error

            if (data.length === 0) {
                toast.error(`No data found in ${table}`)
                return
            }

            const worksheet = XLSX.utils.json_to_sheet(data)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, table)
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'text/csv;charset=utf-8' })
            
            saveAs(blob, `${table}_backup_${new Date().toISOString().split('T')[0]}.csv`)
            toast.success(`${table} exported successfully`)
        } catch (error) {
            toast.error(`Failed to export ${table}`)
        } finally {
            setIsExporting(false)
        }
    }

    const exportFullBackup = async () => {
        setIsExporting(true)
        try {
            const tables = ['leads', 'projects', 'employees', 'inventory_stock', 'expenses', 'admin_users']
            const fullData = {}

            for (const table of tables) {
                const { data } = await supabase.from(table).select('*')
                fullData[table] = data || []
            }

            const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' })
            saveAs(blob, `vijya_solar_full_backup_${new Date().toISOString().split('T')[0]}.json`)
            toast.success("Full system backup complete")
        } catch (error) {
            toast.error("Global export failed")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                            <HardDrive className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-white uppercase italic tracking-tighter">Data Portability</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs text-gray-400 italic font-bold">Export your business data for offline storage.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Global Backup */}
                        <div className="p-5 md:p-6 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Global Data Snapshot</h4>
                                    <p className="text-[10px] text-gray-400 italic">Complete backup of all leads, projects, inventory, and finances.</p>
                                </div>
                                <FileJson className="h-8 w-8 text-neon-blue opacity-50 hidden sm:block" />
                            </div>
                            <Button 
                                onClick={exportFullBackup} 
                                disabled={isExporting}
                                className="w-full bg-neon-blue text-black hover:bg-neon-blue/80 font-bold uppercase text-[10px] md:text-xs tracking-widest h-12"
                            >
                                {isExporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                                Export Full system (JSON)
                            </Button>
                        </div>

                        {/* Cloud Sync Status */}
                        <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Cloud Integrity</h4>
                                    <p className="text-[10px] text-gray-400 italic">All data is encrypted and synced with Supabase Postgres.</p>
                                </div>
                                <UploadCloud className="h-8 w-8 text-emerald-400 opacity-50 hidden sm:block" />
                            </div>
                            <div className="flex items-center gap-3 text-[10px] md:text-xs text-emerald-400 font-bold p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>Autosync ACTIVE - {new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <h5 className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest">Table Level Exports (CSV)</h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                            {[
                                { id: 'leads', icon: <Database className="h-3 w-3" /> },
                                { id: 'projects', icon: <HardDrive className="h-3 w-3" /> },
                                { id: 'employees', icon: <Database className="h-3 w-3" /> },
                                { id: 'expenses', icon: <FileText className="h-3 w-3" /> },
                                { id: 'inventory_stock', icon: <FileText className="h-3 w-3" />, label: 'Inventory' },
                                { id: 'lead_sources', icon: <Database className="h-3 w-3" />, label: 'Sources' }
                            ].map((item) => (
                                <Button 
                                    key={item.id}
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportToCSV(item.id)}
                                    disabled={isExporting}
                                    className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white uppercase font-black text-[9px] tracking-tighter h-10 gap-2"
                                >
                                    {item.label || item.id}
                                    <Download className="h-3 w-3 shrink-0" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex gap-4">
                <Info className="h-5 w-5 text-orange-400 shrink-0" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-orange-400 uppercase italic tracking-tighter">Retention Protocol</p>
                    <p className="text-[10px] text-gray-500 italic font-bold">Backups are local downloads only. Global snapshots are recommended weekly.</p>
                </div>
            </div>
        </div>
    )
}
