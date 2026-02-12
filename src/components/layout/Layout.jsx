import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { CommandPalette } from './CommandPalette'

export function Layout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Global Command Palette */}
      <div className="flex-1 w-full max-w-xl mx-auto md:mx-0 py-2 px-4 md:px-0">
          <CommandPalette />
      </div>

      {/* Desktop Sidebar */}
      <Sidebar />

      <div className="flex flex-col sm:gap-4 sm:pl-14 md:pl-64 lg:pl-72 transition-all duration-300">
        <Header />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:p-6 mt-20 mb-20 md:mb-0">
             <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}
