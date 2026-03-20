import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Users, Mail, Phone, Briefcase, Eye, Pencil,
  Trash2, Loader2, Clock, Award, Tag,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { applicantsService } from '@/services/applicants'
import type { ApplicantListItem } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'

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
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
              <span>{applicant.phone}</span>
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

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', search, sourceFilter, ordering],
    queryFn: () =>
      applicantsService.list({
        ...(search && { search }),
        ...(sourceFilter && { source: sourceFilter }),
        ordering,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicantsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Applicant deleted')
    },
    onError: () => toast.error('Failed to delete applicant'),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this applicant?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Applicants</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total applicants</p>
        </div>
        <Button onClick={() => navigate('/applicants/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Applicant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={sourceFilter || 'ALL'}
          onValueChange={(v) => setSourceFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] min-[400px]:w-40">
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
        <Select value={ordering} onValueChange={setOrdering}>
          <SelectTrigger className="w-[calc(50%-6px)] min-[400px]:w-44">
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
      </div>

      {/* Grid */}
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
      ) : (
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
      )}
    </div>
  )
}
