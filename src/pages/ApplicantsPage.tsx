import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Users, Mail, Phone, Briefcase, Eye, Pencil,
  Trash2, Loader2, Clock, Award, Tag, Download, Upload,
  LayoutGrid, LayoutList, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { WhatsAppIcon } from '@/components/WhatsAppIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApplicantImportDialog } from '@/components/ApplicantImportDialog'
import { applicantsService } from '@/services/applicants'
import type { ApplicantListItem } from '@/types'
import { formatDate, getInitials, cn, normalizePhone, phoneForWhatsApp } from '@/lib/utils'

const SOURCE_COLORS: Record<string, { bg: string; dot: string }> = {
  MANUAL: { bg: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700', dot: 'bg-gray-400' },
  WEBSITE: { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', dot: 'bg-blue-500' },
  LINKEDIN: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800', dot: 'bg-indigo-500' },
  REFERRAL: { bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800', dot: 'bg-green-500' },
  IMPORT: { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800', dot: 'bg-purple-500' },
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
]

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function WhatsAppButton({ phone, size = 'sm' }: { phone: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'h-8 w-8' : 'h-7 w-7'
  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  const waNumber = phoneForWhatsApp(phone)
  return (
    <a
      href={waNumber ? `https://wa.me/${waNumber}` : '#'}
      target={waNumber ? '_blank' : undefined}
      rel="noopener noreferrer"
      title="Chat on WhatsApp"
      className={`inline-flex items-center justify-center rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${sizeClass}`}
      onClick={(e) => {
        e.stopPropagation()
        if (!waNumber) {
          e.preventDefault()
          toast.error('No phone number available for this applicant')
        }
      }}
    >
      <WhatsAppIcon className={iconClass} />
    </a>
  )
}

function ApplicantCard({
  applicant,
  onView,
  onEdit,
  onDelete,
}: {
  applicant: ApplicantListItem
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const source = SOURCE_COLORS[applicant.source] || SOURCE_COLORS.MANUAL
  const gradient = getAvatarGradient(applicant.full_name)

  return (
    <Card
      className="group hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onView}
    >
      {/* Subtle top accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-4">
        {/* Top row: Avatar + Name + Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm', gradient)}>
              <span className="text-[13px] font-bold text-white">
                {getInitials(applicant.full_name)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{applicant.full_name}</p>
              {applicant.current_role ? (
                <p className="text-[12px] text-muted-foreground truncate">{applicant.current_role}{applicant.current_company ? ` at ${applicant.current_company}` : ''}</p>
              ) : (
                <p className="text-[12px] text-muted-foreground">—</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <WhatsAppButton phone={applicant.phone} />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500" title="View" onClick={onView}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-500" title="Edit" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{applicant.email}</span>
          </div>
          {applicant.phone && (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{normalizePhone(applicant.phone)}</span>
            </div>
          )}
        </div>

        {/* Experience + Date row */}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          {applicant.experience_years > 0 && (
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {applicant.experience_years} yrs exp
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(applicant.created_at)}
          </span>
        </div>

        {/* Skills */}
        {applicant.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {applicant.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded text-[10px] font-medium"
              >
                {skill}
              </span>
            ))}
            {applicant.skills.length > 3 && (
              <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-medium">
                +{applicant.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {applicant.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {applicant.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded text-[10px] font-medium"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {applicant.tags.length > 2 && (
              <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-medium">
                +{applicant.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Bottom: source badge */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border', source.bg)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', source.dot)} />
            {applicant.source}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ApplicantsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', search, sourceFilter, ordering, page],
    queryFn: () =>
      applicantsService.list({
        ...(search && { search }),
        ...(sourceFilter && { source: sourceFilter }),
        ordering,
        page: String(page),
      }),
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  // Reset to page 1 when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleSourceFilter = (v: string) => { setSourceFilter(v === 'ALL' ? '' : v); setPage(1) }
  const handleOrdering = (v: string) => { setOrdering(v); setPage(1) }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicantsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Applicant deleted')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete applicant')),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this applicant?')) {
      deleteMutation.mutate(id)
    }
  }

  const [isExporting, setIsExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true)
    try {
      const filters: Record<string, string> = {}
      if (search) filters.search = search
      if (sourceFilter) filters.source = sourceFilter
      await applicantsService.export(filters, format)
      toast.success(`Export started (${format.toUpperCase()})`)
    } catch (err) {
      toast.error(extractApiError(err, 'Export failed'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">Applicants</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total applicants</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Select onValueChange={(v) => handleExport(v as 'csv' | 'xlsx')}>
            <SelectTrigger className="w-full sm:w-32 h-9" disabled={isExporting}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="xlsx">Export Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-full sm:w-auto" onClick={() => navigate('/applicants/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Applicant
          </Button>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select
          value={sourceFilter || 'ALL'}
          onValueChange={handleSourceFilter}
        >
          <SelectTrigger className="w-full min-[400px]:w-40">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All sources</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
            <SelectItem value="WEBSITE">Website</SelectItem>
            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="IMPORT">Import</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordering} onValueChange={handleOrdering}>
          <SelectTrigger className="w-full min-[400px]:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
            <SelectItem value="full_name">Name A–Z</SelectItem>
            <SelectItem value="-full_name">Name Z–A</SelectItem>
            <SelectItem value="-experience_years">Most experienced</SelectItem>
            <SelectItem value="experience_years">Least experienced</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center border rounded-lg overflow-hidden ml-auto">
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setViewMode('table')}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Table
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading applicants...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applicants found</p>
          <p className="text-sm mt-1">Add your first applicant to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid / Card View ── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.results.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onView={() => navigate(`/applicants/${applicant.id}`)}
              onEdit={() => navigate(`/applicants/${applicant.id}?edit=true`)}
              onDelete={() => handleDelete(applicant.id)}
            />
          ))}
        </div>
      ) : (
        /* ── Table View ── */
        <>
          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {data?.results.map((applicant) => {
              const source = SOURCE_COLORS[applicant.source] || SOURCE_COLORS.MANUAL
              return (
                <Card
                  key={applicant.id}
                  className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => navigate(`/applicants/${applicant.id}`)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn('w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0', getAvatarGradient(applicant.full_name))}>
                      <span className="text-[10px] font-bold text-white">{getInitials(applicant.full_name)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{applicant.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{applicant.email}</p>
                    </div>
                  </div>
                  {applicant.current_role && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{applicant.current_role}{applicant.current_company ? ` at ${applicant.current_company}` : ''}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', source.bg)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', source.dot)} />
                      {applicant.source}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(applicant.created_at)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <WhatsAppButton phone={applicant.phone} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => navigate(`/applicants/${applicant.id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => navigate(`/applicants/${applicant.id}?edit=true`)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(applicant.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Desktop table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 800 }}>
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applicant</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Phone</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Role</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Source</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Experience</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Added</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.results.map((applicant) => {
                    const source = SOURCE_COLORS[applicant.source] || SOURCE_COLORS.MANUAL
                    return (
                      <tr
                        key={applicant.id}
                        className="group hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/applicants/${applicant.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0', getAvatarGradient(applicant.full_name))}>
                              <span className="text-[10px] font-bold text-white">{getInitials(applicant.full_name)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-[13px]">{applicant.full_name}</p>
                              <p className="text-[11px] text-muted-foreground">{applicant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {normalizePhone(applicant.phone) || '—'}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground max-w-[180px]">
                          <span className="truncate block">
                            {applicant.current_role || '—'}
                            {applicant.current_role && applicant.current_company ? ` at ${applicant.current_company}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border', source.bg)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', source.dot)} />
                            {applicant.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {applicant.experience_years > 0 ? `${applicant.experience_years} yrs` : '—'}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {formatDate(applicant.created_at)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5">
                            <WhatsAppButton phone={applicant.phone} size="md" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                              title="View"
                              onClick={() => navigate(`/applicants/${applicant.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                              title="Edit"
                              onClick={() => navigate(`/applicants/${applicant.id}?edit=true`)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete"
                              onClick={() => handleDelete(applicant.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
              acc.push(p)
              return acc
            }, [])
            .map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 p-0 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ApplicantImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={() => qc.invalidateQueries({ queryKey: ['applicants'] })}
      />
    </div>
  )
}
