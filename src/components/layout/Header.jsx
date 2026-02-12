import React from 'react'
import { Bell, Search, CircleUser, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDispatch } from 'react-redux'
// import { logout } from '@/features/auth/authSlice' // Todo
import { supabase } from '@/lib/supabaseClient'
import { clearUser } from '@/features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    dispatch(clearUser())
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 fixed top-0 right-0 left-0 md:left-64 lg:left-72 z-10 bg-background">
      <div className="w-full flex-1">
        {/* Search bar removed */}
      </div>
      {/* Notifications and User Menu removed */}
    </header>
  )
}
