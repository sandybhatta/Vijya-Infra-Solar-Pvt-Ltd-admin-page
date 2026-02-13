import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Settings as SettingsIcon, 
    Building2, 
    Shield, 
    Target, 
    Wallet, 
    Boxes, 
    Zap, 
    Lock, 
    HardDrive,
    Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from "@/components/ui/badge"

// Sub-components
import { BusinessProfileTab } from '@/components/settings/BusinessProfileTab'
import { AdminUsersTab } from '@/components/settings/AdminUsersTab'
import { LeadSourcesTab } from '@/components/settings/LeadSourcesTab'
import { ExpenseCategoriesTab } from '@/components/settings/ExpenseCategoriesTab'
import { MaterialsPricingTab } from '@/components/settings/MaterialsPricingTab'
import { MarketingCampaignsTab } from '@/components/settings/MarketingCampaignsTab'
import { SecuritySystemTab } from '@/components/settings/SecuritySystemTab'
import { BackupExportTab } from '@/components/settings/BackupExportTab'

// Hook for real-time syncing across all settings
// Build: 2026-02-13-T11-45
import { useSettingsRealtime } from '@/hooks/useSettings'

export default function Settings() {
    // Enable real-time sync for all sub-components
    useSettingsRealtime()

    const [activeTab, setActiveTab] = useState('profile')

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <Building2 className="h-4 w-4" />, component: <BusinessProfileTab /> },
        { id: 'admins', label: 'Admins', icon: <Shield className="h-4 w-4" />, component: <AdminUsersTab /> },
        { id: 'leads', label: 'Leads', icon: <Target className="h-4 w-4" />, component: <LeadSourcesTab /> },
        { id: 'expenses', label: 'Expenses', icon: <Wallet className="h-4 w-4" />, component: <ExpenseCategoriesTab /> },
        { id: 'materials', label: 'Pricing', icon: <Boxes className="h-4 w-4" />, component: <MaterialsPricingTab /> },
        { id: 'marketing', label: 'Marketing', icon: <Zap className="h-4 w-4" />, component: <MarketingCampaignsTab /> },
        { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" />, component: <SecuritySystemTab /> },
        { id: 'backup', label: 'Backup', icon: <HardDrive className="h-4 w-4" />, component: <BackupExportTab /> },
    ]

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div className="w-full">
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3 md:gap-4 leading-tight">
                        <SettingsIcon className="h-8 w-8 md:h-10 md:w-10 text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.4)]" />
                        System <span className="text-neon-blue">Settings</span>
                    </h1>
                    <p className="text-muted-foreground text-[10px] md:text-xs mt-2 uppercase tracking-widest font-black opacity-50 italic leading-relaxed">
                        Configure business protocols, access levels, and system parameters.
                    </p>
                </div>
            </header>

            {/* Main Tabs Layout */}
            <Tabs 
                defaultValue="profile" 
                onValueChange={setActiveTab}
                className="w-full space-y-6 md:space-y-8"
            >
                <div className="w-full overflow-hidden">
                    <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex overflow-x-auto scrollbar-hide w-full justify-start md:justify-center rounded-2xl no-scrollbar">
                        {tabs.map((tab) => (
                            <TabsTrigger 
                                key={tab.id}
                                value={tab.id}
                                className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl data-[state=active]:bg-neon-blue data-[state=active]:text-black text-gray-400 font-bold text-[10px] md:text-xs uppercase transition-all whitespace-nowrap"
                            >
                                {tab.icon}
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="min-h-[500px] md:min-h-[600px] relative">
                    <AnimatePresence mode="wait">
                        {tabs.map((tab) => (
                            activeTab === tab.id && (
                                <TabsContent 
                                    key={tab.id}
                                    value={tab.id} 
                                    forceMount 
                                    className="mt-0 focus-visible:outline-none"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                    >
                                        {tab.component}
                                    </motion.div>
                                </TabsContent>
                            )
                        ))}
                    </AnimatePresence>
                </div>
            </Tabs>

            {/* System Info Footer */}
            <footer className="pt-8 md:pt-12 border-t border-white/5 pb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="h-10 w-10 rounded-xl bg-neon-blue/10 flex items-center justify-center border border-neon-blue/20 shrink-0">
                            <Info className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white uppercase italic tracking-tight">Technical Support</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">24/7 Priority Assistance Active</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-end w-full md:w-auto">
                        <Badge variant="outline" className="border-white/10 text-gray-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 md:px-3 whitespace-nowrap">Build 2.4.0-STABLE</Badge>
                        <Badge variant="outline" className="border-neon-blue/20 text-neon-blue text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 md:px-3 whitespace-nowrap">Encrypted / SSL v3</Badge>
                    </div>
                </div>
            </footer>
        </div>
    )
}
