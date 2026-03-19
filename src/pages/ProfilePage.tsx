import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Shield, Building2, Key, Palette,
  LogOut, Settings, CheckCircle, Crown, Hash, Calendar,
  Fingerprint, Globe, Lock, Unlock, Copy, Check,
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
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
  const sizes = { md: 'h-14 w-14 text-lg', lg: 'h-20 w-20 text-2xl', xl: 'h-28 w-28 text-3xl' }
  return (
    <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0 shadow-lg', gradients[hash % gradients.length], sizes[size])}>
      {initials}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function InfoRow({ icon: Icon, label, value, mono, copyable, color = 'blue' }: {
  icon: React.ElementType
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
  color?: 'blue' | 'indigo' | 'violet' | 'amber' | 'emerald' | 'teal' | 'rose' | 'purple' | 'cyan' | 'orange'
}) {
  const colors: Record<string, { bg: string; icon: string }> = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'text-blue-600 dark:text-blue-400' },
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',  icon: 'text-indigo-600 dark:text-indigo-400' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',  icon: 'text-violet-600 dark:text-violet-400' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',   icon: 'text-amber-600 dark:text-amber-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
    teal:    { bg: 'bg-teal-50 dark:bg-teal-900/20',    icon: 'text-teal-600 dark:text-teal-400' },
    rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',    icon: 'text-rose-600 dark:text-rose-400' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',  icon: 'text-purple-600 dark:text-purple-400' },
    cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-900/20',    icon: 'text-cyan-600 dark:text-cyan-400' },
    orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20',  icon: 'text-orange-600 dark:text-orange-400' },
  }
  const c = colors[color]
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors group">
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
        <Icon className={cn('h-4 w-4', c.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className={cn('text-sm font-medium truncate mt-0.5', mono && 'font-mono text-xs')}>{value || '\u2014'}</p>
      </div>
      {copyable && value && <CopyButton text={value} />}
    </div>
  )
}

function SectionCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
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

  const displayName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const enabledModules = user.enabled_modules || []
  const permissionEntries = Object.entries(user.permissions || {})
  const allowedCount = permissionEntries.filter(([, v]) => v === true).length
  const deniedCount = permissionEntries.filter(([, v]) => v === false).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Hero Profile Card */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        {/* Gradient banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white rounded-full translate-y-1/2" />
            <div className="absolute top-1/2 left-2/3 w-20 h-20 bg-white rounded-full" />
          </div>
        </div>

        {/* Profile info below banner */}
        <div className="px-5 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16">
            <div className="ring-4 ring-card rounded-full shadow-xl">
              <GradientAvatar name={displayName} size="xl" />
            </div>
            <div className="flex-1 min-w-0 pb-1 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{displayName}</h1>
                {user.is_super_admin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-700/50">
                    <Crown className="h-3 w-3" /> Super Admin
                  </span>
                )}
                {!user.is_super_admin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50">
                    <Shield className="h-3 w-3" /> User
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.full_name && user.full_name !== user.email && (
                <p className="text-xs text-muted-foreground/70">
                  {user.first_name} {user.last_name}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="gap-1.5">
                <Settings className="h-4 w-4" /> Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Modules:</span>
              <span className="font-semibold">{enabledModules.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Permissions:</span>
              <span className="font-semibold">{permissionEntries.length}</span>
            </div>
            {permissionEntries.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Allowed:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{allowedCount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-muted-foreground">Denied:</span>
                  <span className="font-semibold text-red-500">{deniedCount}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Information */}
          <SectionCard icon={User} title="Personal Information" color="blue">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={User} label="First Name" value={user.first_name} color="blue" />
              <InfoRow icon={User} label="Last Name" value={user.last_name} color="indigo" />
              <InfoRow icon={Hash} label="Full Name" value={user.full_name} color="violet" />
              <InfoRow icon={Mail} label="Email Address" value={user.email} color="rose" copyable />
              <InfoRow icon={Shield} label="Role" value={user.is_super_admin ? 'Super Admin' : 'Standard User'} color="amber" />
              <InfoRow icon={Fingerprint} label="User ID" value={user.id} mono copyable color="cyan" />
            </div>
          </SectionCard>

          {/* Organization */}
          <SectionCard icon={Building2} title="Organization" color="emerald">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Globe} label="Tenant Slug" value={user.tenant_slug} color="emerald" copyable />
              <InfoRow icon={Key} label="Tenant ID" value={user.tenant_id} mono copyable color="teal" />
            </div>
          </SectionCard>

          {/* Permissions */}
          {permissionEntries.length > 0 && (
            <SectionCard icon={Shield} title={`Permissions (${permissionEntries.length})`} color="purple">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {permissionEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {value === true ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <Unlock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : value === false ? (
                        <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                          <Lock className="h-3 w-3 text-red-500 dark:text-red-400" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <Key className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <span className="text-sm capitalize truncate">{key.replace(/_/g, ' ')}</span>
                    </div>
                    {typeof value === 'boolean' ? (
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        value
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      )}>
                        {value ? 'Allowed' : 'Denied'}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{String(value)}</span>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-5">
          {/* Enabled Modules */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-sm">Enabled Modules</h3>
              </div>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                {enabledModules.length}
              </span>
            </div>
            <div className="p-4">
              {enabledModules.length > 0 ? (
                <div className="space-y-1.5">
                  {enabledModules.map((mod) => (
                    <div key={mod} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm capitalize">{mod.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No modules enabled</p>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b">
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-sm">Preferences</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Theme */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'p-2.5 rounded-lg border text-center transition-all text-xs font-medium capitalize',
                        (t === 'system' ? !['light', 'dark'].includes(resolvedTheme || '') : resolvedTheme === t)
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                          : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/30'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved theme preference from API */}
              {user.preferences?.theme && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saved Preference</span>
                  </div>
                  <p className="text-sm capitalize">{user.preferences.theme}</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Summary */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b">
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-sm">Security Summary</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Admin Access</span>
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  user.is_super_admin
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {user.is_super_admin ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Permissions</span>
                <span className="text-xs font-semibold">{permissionEntries.length} rules</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Modules</span>
                <span className="text-xs font-semibold">{enabledModules.length} active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Auth</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">JWT Bearer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
