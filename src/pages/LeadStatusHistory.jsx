import React, { useState } from 'react'
import { useGetAllLeadHistoryQuery } from '@/features/leads/leadsApi'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function LeadStatusHistory() {
    const { data, isLoading } = useGetAllLeadHistoryQuery({ page: 1, limit: 50 })

    const columns = [
        {
            accessorKey: 'leads.name',
            header: 'Lead Name',
            cell: ({ row }) => <div className="font-medium text-white">{row.original.leads?.name || 'Unknown Lead'}</div>
        },
        {
            accessorKey: 'status',
            header: 'New Status',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize text-neon-blue border-neon-blue">
                    {row.getValue('status')}
                </Badge>
            )
        },
        {
            accessorKey: 'note',
            header: 'Notes',
            cell: ({ row }) => <div className="text-gray-400 truncate max-w-[300px]">{row.getValue('note') || '-'}</div>
        },
        {
            accessorKey: 'changed_at',
            header: 'Date',
            cell: ({ row }) => <div className="text-gray-400">{format(new Date(row.getValue('changed_at')), 'PP p')}</div>
        }
    ]

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <h1 className="text-2xl font-bold text-white">Lead Status History</h1>
            <div className="bg-glass-bg rounded-xl border border-glass-border overflow-hidden p-1">
                 {isLoading ? <div className="p-10 text-center text-neon-blue flex justify-center"><Loader2 className="animate-spin mr-2"/> Loading history...</div> : (
                     <DataTable 
                        columns={columns} 
                        data={data?.history || []} 
                        pageCount={Math.ceil((data?.total || 0) / 50)}
                        searchKey="leads.name" // DataTable might need nested support or custom filter
                     />
                 )}
            </div>
        </div>
    )
}
