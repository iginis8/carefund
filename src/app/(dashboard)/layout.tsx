'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="!w-72 max-w-[80%] p-0 bg-background !h-[100dvh]" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Mobile header — fixed, never shifts */}
        <header className="shrink-0 flex h-14 items-center gap-3 border-b px-4 bg-background md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">CareFund</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-none p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
