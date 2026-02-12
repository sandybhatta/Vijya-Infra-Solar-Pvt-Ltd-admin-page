"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Users,
  Briefcase,
  Search,
  FileText,
  Loader2,
  Phone,
  MapPin
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState({ leads: [], projects: [], invoices: [] })
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

  React.useEffect(() => {
    if (!open) {
        setQuery("")
        setResults({ leads: [], projects: [], invoices: [] })
    }
  }, [open])

  React.useEffect(() => {
    const search = async () => {
        if (query.length < 2) {
            setResults({ leads: [], projects: [], invoices: [] })
            return
        }

        setLoading(true)
        try {
            const [leadsRes, projectsRes, invoicesRes] = await Promise.all([
                supabase.from('leads').select('id, name, phone_number, email').or(`name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`).limit(5),
                supabase.from('projects').select('id, project_name, installation_address').ilike('project_name', `%${query}%`).limit(5),
                supabase.from('invoices').select('id, invoice_number, invoice_amount').ilike('invoice_number', `%${query}%`).limit(5)
            ])

            setResults({
                leads: leadsRes.data || [],
                projects: projectsRes.data || [],
                invoices: invoicesRes.data || []
            })
        } catch (error) {
            console.error("Search failed", error)
        } finally {
            setLoading(false)
        }
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const runCommand = React.useCallback((command) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center w-64 h-9 px-3 rounded-md border border-input bg-transparent shadow-sm text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
      >
        <Search className="mr-2 h-4 w-4 opacity-50" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search database..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Searching...</span> : "No results found."}</CommandEmpty>
          
          {(results.leads.length > 0) && (
              <CommandGroup heading="Leads">
                  {results.leads.map(lead => (
                      <CommandItem key={lead.id} onSelect={() => runCommand(() => navigate(`/leads/${lead.id}`))}>
                          <User className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                              <span>{lead.name}</span>
                              <span className="text-xs text-muted-foreground">{lead.phone_number} • {lead.email}</span>
                          </div>
                      </CommandItem>
                  ))}
              </CommandGroup>
          )}

          {(results.projects.length > 0) && (
              <CommandGroup heading="Projects">
                  {results.projects.map(proj => (
                      <CommandItem key={proj.id} onSelect={() => runCommand(() => navigate(`/projects/${proj.id}`))}>
                          <Briefcase className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                              <span>{proj.project_name || 'Unnamed Project'}</span>
                              <span className="text-xs text-muted-foreground">{proj.installation_address}</span>
                          </div>
                      </CommandItem>
                  ))}
              </CommandGroup>
          )}

          {(results.invoices.length > 0) && (
              <CommandGroup heading="Invoices">
                  {results.invoices.map(inv => (
                      <CommandItem key={inv.id} onSelect={() => runCommand(() => navigate(`/invoices`))}> {/* Todo: Invoice details page */}
                          <FileText className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                              <span>{inv.invoice_number}</span>
                              <span className="text-xs text-muted-foreground">${inv.invoice_amount}</span>
                          </div>
                      </CommandItem>
                  ))}
              </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/leads'))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Leads</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/projects'))}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Projects</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/invoices'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Invoices</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
