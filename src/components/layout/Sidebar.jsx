import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  DollarSign,
  Package,
  Wrench,
  UserCog,
  CheckSquare,
  Megaphone,
  Settings,
  Shield,
  LogOut,
  BarChart3, // Added
  Globe // Added
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Website Enquiries', path: '/users', icon: Globe },
  { name: 'Reports', path: '/reports', icon: BarChart3 }, // Added
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Sources', path: '/lead-sources', icon: Users }, // Added
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

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="hidden border-r border-neon-blue/10 bg-black/95 md:block md:w-64 lg:w-72 h-screen overflow-y-auto fixed left-0 top-0 text-white relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,243,255,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="flex h-14 items-center border-b border-white/10 px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="">Solar Admin</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                location.pathname === item.path
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
