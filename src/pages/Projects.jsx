import React, { useState, useEffect } from 'react'
import { 
  useGetProjectsQuery, 
  useGetProjectStatsQuery 
} from '@/features/projects/projectsApi'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileBarChart, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { exportToCSV } from '@/lib/exportUtils'

// Components
import ProjectKPIs from '@/components/projects/ProjectKPIs'
import ProjectCharts from '@/components/projects/ProjectCharts'
import ProjectsTable from '@/components/projects/ProjectsTable'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import EditProjectModal from '@/components/projects/EditProjectModal'
import DeleteProjectModal from '@/components/projects/DeleteProjectModal'

export default function Projects() {
    const [statusFilter, setStatusFilter] = useState('all')
    const [solarTypeFilter, setSolarTypeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('newest')
    
    // API Queries
    const { 
        data: projectsData, 
        isLoading: isProjectsLoading, 
        refetch: refetchProjects 
    } = useGetProjectsQuery({ 
        page: 1, 
        limit: 100, 
        status: statusFilter,
        solarType: solarTypeFilter,
        sortBy
    })

    const { 
        data: statsData, 
        isLoading: isStatsLoading, 
        refetch: refetchStats 
    } = useGetProjectStatsQuery()

    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [activeProject, setActiveProject] = useState(null)

    // Real-time Subscriptions
    useEffect(() => {
        const channel = supabase
            .channel('projects-erp-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                refetchProjects()
                refetchStats()
                toast.success("Project updated in realtime", { icon: '⚡' })
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
                refetchProjects()
                refetchStats()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
                refetchProjects()
                refetchStats()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [refetchProjects, refetchStats])

    const handleExport = () => {
        if (!projectsData?.projects) return
        
        const headers = [
            { label: 'Project Name', key: 'project_name' },
            { label: 'Client', key: 'lead_name' },
            { label: 'Status', key: 'project_status' },
            { label: 'Type', key: 'solar_type' },
            { label: 'Capacity (kW)', key: 'capacity_kw' },
            { label: 'Invoiced', key: 'total_invoiced' },
            { label: 'Paid', key: 'total_paid' },
            { label: 'Profit', key: 'net_profit' },
            { label: 'Margin %', key: 'profit_margin' }
        ]

        const exportData = projectsData.projects.map(p => ({
            ...p,
            lead_name: p.leads?.name,
            profit_margin: p.profit_margin?.toFixed(2)
        }))

        exportToCSV(exportData, 'Projects_ROI_Report', headers)
        toast.success("Downloading export...")
    }

    const handleEdit = (project) => {
        setActiveProject(project)
        setIsEditModalOpen(true)
    }

    const handleDelete = (project) => {
        setActiveProject(project)
        setIsDeleteModalOpen(true)
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen bg-black overflow-x-hidden">
            {/* Header section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan uppercase italic">
                        Projects Command Center
                    </h1>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">
                        Track installations • Financials • Logistics • Profitability
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <Button 
                        onClick={() => { refetchProjects(); refetchStats(); }} 
                        variant="outline" 
                        className="bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleExport} variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white whitespace-nowrap">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white whitespace-nowrap">
                        <FileBarChart className="mr-2 h-4 w-4" /> Report
                    </Button>
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="bg-neon-blue text-black font-black uppercase tracking-widest hover:bg-neon-blue/80 shadow-[0_0_20px_rgba(0,243,255,0.4)] whitespace-nowrap"
                    >
                        <Plus className="mr-2 h-5 w-5" /> New Project
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <ProjectKPIs 
                stats={statsData} 
                isLoading={isStatsLoading} 
            />

            {/* Analytics Charts Section */}
            <ProjectCharts 
                stats={statsData} 
                projects={projectsData?.projects || []} 
            />

            {/* Main Table Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <RefreshCw className={isProjectsLoading ? "animate-spin h-5 w-5 text-neon-blue" : "h-5 w-5 text-neon-blue"} />
                        Installation Portfolio
                    </h2>
                </div>
                
                <ProjectsTable 
                    data={projectsData?.projects || []} 
                    isLoading={isProjectsLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modals */}
            <CreateProjectModal 
                open={isCreateModalOpen} 
                setOpen={setIsCreateModalOpen} 
            />
            {activeProject && (
                <>
                    <EditProjectModal 
                        open={isEditModalOpen} 
                        setOpen={setIsEditModalOpen} 
                        project={activeProject} 
                    />
                    <DeleteProjectModal 
                        open={isDeleteModalOpen} 
                        setOpen={setIsDeleteModalOpen} 
                        project={activeProject} 
                    />
                </>
            )}
        </div>
    )
}
