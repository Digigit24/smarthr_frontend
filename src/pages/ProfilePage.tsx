import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Shield, Building2, Key, Palette,
  LogOut, Settings, CheckCircle, Crown,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function GradientAvatar({ name, size = 'lg' }: { name: string; size?: 'md' | 'lg' | 'xl' }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const sizes = { md: 'h-14 w-14 text-lg', lg: 'h-20 w-20 text-2xl', xl: 'h-24 w-24 text-3xl' }
  return (
    <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0 shadow-lg', gradients[hash % gradients.length], sizes[size])}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { resolvedTheme, setTheme } = useTheme()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <User className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Not logged in</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </div>
    )
  }

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const enabledModules = user.enabled_modules || []
  const permissionEntries = Object.entries(user.permissions || {})

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Hero Profile Card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-white rounded-full translate-y-1/2" />
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            <div className="ring-4 ring-card rounded-full">
              <GradientAvatar name={displayName} size="xl" />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">{displayName}</h1>
                {user.is_super_admin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Crown className="h-3 w-3" /> Super Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-1.5" /> Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1.5" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Account Details */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm">Account Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">First Name</p>
                  <p className="text-sm font-medium">{user.first_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Last Name</p>
                  <p className="text-sm font-medium">{user.last_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium">{user.is_super_admin ? 'Super Admin' : 'User'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-sm">Organization</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Tenant Slug</p>
                  <p className="text-sm font-medium">{user.tenant_slug || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                  <Key className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Tenant ID</p>
                  <p className="text-sm font-medium font-mono text-xs truncate">{user.tenant_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {permissionEntries.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-sm">Permissions</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {permissionEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                    {typeof value === 'boolean' ? (
                      <span className={cn('text-xs font-medium', value ? 'text-emerald-600' : 'text-muted-foreground')}>
                        {value ? 'Allowed' : 'Denied'}
                      </span>
                    ) : (
                      <span className="text-xs font-medium">{String(value)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <div className={cn(
            'rounded-xl border-2 p-4 sm:p-5',
            user.is_super_admin ? 'border-amber-200 dark:border-amber-800/50' : 'border-blue-200 dark:border-blue-800/50'
          )}>
            <div className="text-center">
              <GradientAvatar name={displayName} size="lg" />
              <h3 className="font-bold mt-3">{displayName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              {user.is_super_admin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 mt-2 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Crown className="h-3 w-3" /> Super Admin
                </span>
              )}
            </div>
          </div>

          {/* Enabled Modules */}
          {enabledModules.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-3">Enabled Modules</h3>
              <div className="space-y-1.5">
                {enabledModules.map((mod) => (
                  <div key={mod} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-muted-foreground">{mod.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Theme */}
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Appearance</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex-1 p-3 rounded-lg border text-center transition-all text-xs font-medium',
                  resolvedTheme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border/80'
                )}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex-1 p-3 rounded-lg border text-center transition-all text-xs font-medium',
                  resolvedTheme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border/80'
                )}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Account ID */}
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-2">Account ID</h3>
            <p className="text-xs font-mono text-muted-foreground break-all bg-muted/30 p-2 rounded">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
