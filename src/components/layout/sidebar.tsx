'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Heart,
  LayoutDashboard,
  DollarSign,
  Receipt,
  Shield,
  Settings,
  Crown,
  Bot,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { store } from '@/lib/store'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Money', href: '/money', icon: DollarSign },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Benefits', href: '/benefits', icon: Shield },
  { label: 'AI Assistant', href: '/assistant', icon: Bot },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const profile = store.getProfile()
  const premium = store.isPremium()
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn('flex h-full flex-col bg-sidebar text-sidebar-foreground', className)}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Heart className="size-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight">CareFund</span>
      </div>

      <Separator />

      {/* Main navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('size-4', isActive && 'text-primary')} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Settings icon, separated from main nav */}
      <div className="px-3 pb-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings' || pathname.startsWith('/settings/')
              ? 'bg-sidebar-accent text-primary'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}
        >
          <Settings className={cn('size-4', (pathname === '/settings' || pathname.startsWith('/settings/')) && 'text-primary')} />
          Settings
        </Link>
      </div>

      <Separator />

      {/* User info */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar size="default">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium">{profile.full_name}</span>
          {premium ? (
            <span className="text-xs text-amber-600 flex items-center gap-1"><Crown className="h-2.5 w-2.5" /> Premium</span>
          ) : (
            <span className="text-xs text-muted-foreground">Free Plan</span>
          )}
        </div>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}
