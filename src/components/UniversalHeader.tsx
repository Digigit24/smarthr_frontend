import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Sun, Moon, Bell, Settings, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, getTimeBasedGreeting, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface UniversalHeaderProps {
  pageTitle: string
  onMobileMenuOpen: () => void
  unreadCount?: number
}

export function UniversalHeader({
  pageTitle,
  onMobileMenuOpen,
  unreadCount = 0,
}: UniversalHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'User'

  return (
    <header className="h-14 border-b border-border bg-background px-4 md:px-5 flex items-center justify-between shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          className="p-1.5 rounded-lg hover:bg-accent transition-colors lg:hidden"
          onClick={onMobileMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {displayName}, {getTimeBasedGreeting()}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg hover:bg-accent transition-colors relative"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
          <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
        </button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <span className="text-[11px] font-medium text-foreground">
                  {getInitials(displayName)}
                </span>
              </div>
              <span className="hidden md:inline text-xs text-foreground font-medium">
                {displayName.split(' ')[0]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
