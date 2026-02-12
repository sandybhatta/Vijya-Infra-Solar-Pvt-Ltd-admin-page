import React from 'react'
import { useGetActivityLogsQuery } from '@/features/finance/financeApi'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function ActivityLogs() {
    const { data: logsData, isLoading } = useGetActivityLogsQuery({ page: 1, limit: 50 })
    const logs = logsData?.logs || []

    const columns = [
        { accessorKey: "created_at", header: "Timestamp", cell: ({row}) => <span className="text-gray-400 text-xs">{format(new Date(row.getValue("created_at")), 'MMM dd, HH:mm:ss')}</span> },
        { accessorKey: "action", header: "Action", cell: ({row}) => <Badge variant="outline" className="uppercase text-xs">{row.getValue("action")}</Badge> },
        { accessorKey: "table_name", header: "Entity", cell: ({row}) => <span className="font-mono text-xs text-neon-blue">{row.getValue("table_name")}</span> },
        { accessorKey: "description", header: "Description", cell: ({row}) => <span className="text-sm">{row.getValue("description") || '-'}</span> },
        // User ID resolving would require joining profiles/users, or we just show ID for now
    ]

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Activity Logs</h1>
                 <p className="text-gray-400">Audit trail of system actions.</p>
            </div>

            <div className="bg-glass-bg rounded-xl border border-glass-border overflow-hidden p-1">
                 {isLoading ? <div className="p-10 text-center text-neon-blue">Loading logs...</div> : (
                     <DataTable 
                        columns={columns} 
                        data={logs} 
                        searchKey="description"
                     /> 
                 )}
            </div>
        </div>
    )
}
