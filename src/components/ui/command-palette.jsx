"use client"

import * as React from "react"
import {
  Calendar,
  CreditCard,
  Settings,
  User,
  Calculator,
  Smile,
  Search,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Package
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk"

const CommandShortcut = ({ className, ...props }) => {
  return (
    <span
      className={`ml-auto text-xs tracking-widest text-muted-foreground ${className}`}
      {...props}
    />
  )
}
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <div className="relative w-full max-w-sm hidden md:flex items-center text-muted-foreground border rounded-md px-3 py-1 cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors" onClick={() => setOpen(true)}>
          <Search className="h-4 w-4 mr-2" />
          <span className="text-sm">Search...</span>
          <kbd className="pointer-events-none absolute right-2 top-[50%] -translate-y-[50%] inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
            <div className="fixed z-50 grid w-full max-w-lg gap-4 rounded-b-lg border bg-background p-0 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 sm:rounded-lg top-[20%]">
                <CommandInput placeholder="Type a command or search..." className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-b px-4" />
                <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))} className="flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/leads'))} className="flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Leads</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/projects'))} className="flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Projects</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/finance/invoices'))} className="flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Invoices</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator className="h-px bg-border -mx-2 my-2" />
                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => navigate('/settings'))} className="flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                </CommandGroup>
                </CommandList>
            </div>
         </div>
      </CommandDialog>
    </>
  )
}
