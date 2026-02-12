import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, DollarSign, Menu, Package, Wrench, CheckSquare, CreditCard, UserCog, Settings, Shield, Megaphone, FileText, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

export function MobileNav() {
  const location = useLocation()
  const [open, setOpen] = React.useState(false)
  
  const bottomNavItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Projects', path: '/projects', icon: Briefcase },
    { name: 'Finance', path: '/payments', icon: DollarSign },
  ]

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports', path: '/reports', icon: BarChart3 }, // Added
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Sources', path: '/lead-sources', icon: Users },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Projects', path: '/projects', icon: Briefcase },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Invoices', path: '/invoices', icon: CreditCard },
    { name: 'Payments', path: '/payments', icon: DollarSign },
    { name: 'Expenses', path: '/expenses', icon: DollarSign }, 
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Materials', path: '/materials', icon: Wrench },
    { name: 'Employees', path: '/employees', icon: UserCog },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Activity Logs', path: '/activity-logs', icon: FileText },
    { name: 'Admins', path: '/admins', icon: Shield },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t h-16 flex items-center justify-around px-2 pb-safe">
       {bottomNavItems.map((item) => (
         <Link
           key={item.path}
           to={item.path}
           className={cn(
             "flex flex-col items-center justify-center w-full h-full space-y-1",
             location.pathname === item.path ? "text-primary" : "text-muted-foreground"
           )}
         >
            <item.icon className={cn("h-5 w-5", location.pathname === item.path && "stroke-[2.5px] drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]")} />
            <span className="text-[10px] font-medium">{item.name}</span>
         </Link>
       ))}
       
       <Sheet open={open} onOpenChange={setOpen}>
           <SheetTrigger asChild>
               <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground">
                   <Menu className="h-5 w-5" />
                   <span className="text-[10px] font-medium">Menu</span>
               </button>
           </SheetTrigger>
           <SheetContent side="left" className="w-[80vw] bg-black/95 border-r-neon-blue/20 p-0 text-white">
               <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,243,255,0.15)_0%,transparent_60%)] pointer-events-none" />
               <div className="flex h-14 items-center border-b border-white/10 px-6">
                    <SheetTitle className="font-semibold text-lg text-white">Solar Admin</SheetTitle>
                    <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
               </div>
               <ScrollArea className="h-[calc(100vh-3.5rem)]">
                   <nav className="flex flex-col gap-1 p-4">
                       {allNavItems.map((item) => (
                           <Link
                               key={item.path}
                               to={item.path}
                               onClick={() => setOpen(false)}
                               className={cn(
                                   "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                   location.pathname === item.path 
                                    ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20 shadow-[0_0_10px_rgba(0,243,255,0.1)]" 
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                               )}
                           >
                               <item.icon className="h-4 w-4" />
                               {item.name}
                           </Link>
                       ))}
                   </nav>
               </ScrollArea>
           </SheetContent>
       </Sheet>
    </div>
  )
}
