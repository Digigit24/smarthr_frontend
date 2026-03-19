import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Users, FileText, GitBranch, Phone,
  ListChecks, Star, Calendar, Bell, Activity, PanelLeftClose, PanelLeft,
  ChevronDown, X, LogOut, Settings, Shield, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  children?: NavItem[]
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'OVERVIEW',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/' }],
  },
  {
    title: 'RECRUITMENT',
    items: [
      { label: 'Jobs', icon: Briefcase, href: '/jobs' },
      { label: 'Applicants', icon: Users, href: '/applicants' },
      { label: 'Applications', icon: FileText, href: '/applications' },
      { label: 'Pipeline', icon: GitBranch, href: '/pipeline' },
    ],
  },
  {
    title: 'AI SCREENING',
    items: [
      { label: 'Call Records', icon: Phone, href: '/calls' },
      { label: 'AI Queues', icon: ListChecks, href: '/call-queues' },
      { label: 'Scorecards', icon: Star, href: '/scorecards' },
    ],
  },
  {
    title: 'INTERVIEWS',
    items: [{ label: 'Interviews', icon: Calendar, href: '/interviews' }],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Notifications', icon: Bell, href: '/notifications' },
      { label: 'Activity Log', icon: Activity, href: '/activities' },
    ],
  },
]

interface SidebarItemProps {
  item: NavItem
  collapsed: boolean
  depth?: number
  onNavigate?: () => void
}

function SidebarItem({ item, collapsed, depth = 0, onNavigate }: SidebarItemProps) {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (item.children) {
    const isAnyChildActive = item.children.some((c) => c.href === location.pathname)
    return (
      <Collapsible open={open || isAnyChildActive} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-3 h-9 px-3 rounded-lg',
              'text-[13px] font-medium text-muted-foreground',
              'hover:text-foreground hover:bg-muted/80 transition-all duration-150'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200',
                    !(open || isAnyChildActive) && '-rotate-90'
                  )}
                />
              </>
            )}
          </button>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent>
            <div className="ml-3 pl-3 border-l border-border/60 space-y-0.5 mt-0.5">
              {item.children.map((child) => (
                <SidebarItem key={child.href} item={child} collapsed={false} depth={1} onNavigate={onNavigate} />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    )
  }

  const isActive = item.href === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.href!)

  if (depth === 1) {
    return (
      <Link
        to={item.href!}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 h-8 px-3 rounded-lg text-[13px]',
          'text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150',
          isActive && 'text-foreground sidebar-active font-medium -ml-[13px] pl-[23px]'
        )}
      >
        <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'sidebar-active-icon')} />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <Link
      to={item.href!}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 h-9 px-3 rounded-lg',
        'text-[13px] font-medium text-muted-foreground',
        'hover:text-foreground hover:bg-muted/80 transition-all duration-150',
        isActive && 'text-foreground bg-primary/8 sidebar-active -ml-0.5 pl-[10px]'
      )}
    >
      <div className={cn(
        'h-7 w-7 rounded-md flex items-center justify-center transition-colors shrink-0',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground'
      )}>
        <item.icon className={cn('h-4 w-4', isActive && 'sidebar-active-icon')} />
      </div>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

function GradientAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs' }
  return (
    <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold shrink-0', gradients[hash % gradients.length], sizes[size])}>
      {initials}
    </div>
  )
}

interface UniversalSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function UniversalSidebar({ mobileOpen, onMobileClose }: UniversalSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'User'

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-background border-r border-border/40 z-50',
          'transition-transform duration-300 shadow-xl flex flex-col',
          'lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="font-semibold text-sm">SmartHR-In</span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent collapsed={false} onNavigate={onMobileClose} />
        <ProfileSection
          collapsed={false}
          displayName={displayName}
          email={user?.email || ''}
          isAdmin={user?.is_super_admin || false}
          onLogout={handleLogout}
          onNavigate={onMobileClose}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-background border-r border-border/40',
          'transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[250px]'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center border-b border-border/40 px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-sm text-foreground block">SmartHR-In</span>
                <span className="text-[10px] text-muted-foreground">Recruitment Platform</span>
              </div>
            )}
          </div>
        </div>
        <SidebarContent collapsed={collapsed} />
        <ProfileSection
          collapsed={collapsed}
          displayName={displayName}
          email={user?.email || ''}
          isAdmin={user?.is_super_admin || false}
          onLogout={handleLogout}
        />
        <CollapseButton collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>
    </>
  )
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-0.5">
          {collapsed ? (
            <div className="flex justify-center mb-1.5">
              <div className="w-5 h-px bg-border" />
            </div>
          ) : (
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/50 uppercase">
                {section.title}
              </span>
            </div>
          )}
          {section.items.map((item) => (
            <SidebarItem key={item.href || item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ProfileSection({
  collapsed,
  displayName,
  email,
  isAdmin,
  onLogout,
  onNavigate,
}: {
  collapsed: boolean
  displayName: string
  email: string
  isAdmin: boolean
  onLogout: () => void
  onNavigate?: () => void
}) {
  const navigate = useNavigate()

  if (collapsed) {
    return (
      <div className="shrink-0 p-2 border-t border-border/40">
        <button
          onClick={() => { navigate('/profile'); onNavigate?.() }}
          className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <GradientAvatar name={displayName} size="sm" />
        </button>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-border/40 p-3 space-y-2">
      <button
        onClick={() => { navigate('/profile'); onNavigate?.() }}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/60 transition-colors group text-left"
      >
        <GradientAvatar name={displayName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{displayName}</p>
          <div className="flex items-center gap-1">
            {isAdmin && <Shield className="h-3 w-3 text-amber-500 shrink-0" />}
            <p className="text-[11px] text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      </button>
      <div className="flex gap-1">
        <button
          onClick={() => { navigate('/settings'); onNavigate?.() }}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </button>
        <button
          onClick={onLogout}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-[11px] text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>
    </div>
  )
}

function CollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const Icon = collapsed ? PanelLeft : PanelLeftClose
  return (
    <div className="shrink-0 p-2 border-t border-border/40">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 h-8 px-3 rounded-lg',
          'text-[12px] font-medium text-muted-foreground',
          'hover:text-foreground hover:bg-muted/80 transition-all duration-150'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Collapse</span>}
      </button>
    </div>
  )
}
