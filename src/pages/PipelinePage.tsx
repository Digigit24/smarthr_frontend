import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, GripVertical, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { SideDrawer } from '@/components/SideDrawer'
import { pipelineService } from '@/services/pipeline'
import type { PipelineStage } from '@/types'
import { cn } from '@/lib/utils'

function StageCard({
  stage,
  onDelete,
}: {
  stage: PipelineStage
  onDelete: (id: string) => void
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground/40 shrink-0" />
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        <div className="flex-1">
          <p className="font-medium text-sm">{stage.name}</p>
          <p className="text-[12px] text-muted-foreground">{stage.slug}</p>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          {stage.is_default && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[11px]">
              Default
            </span>
          )}
          {stage.is_terminal && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded text-[11px]">
              Terminal
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-[13px] w-6 text-center">{stage.order}</span>
        {!stage.is_default && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(stage.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function PipelinePage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    color: '#6b7280',
    is_terminal: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => pipelineService.list(),
  })

  const seedMutation = useMutation({
    mutationFn: () => pipelineService.seedDefaults(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Default stages seeded')
    },
    onError: () => toast.error('Failed to seed stages'),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<PipelineStage>) => pipelineService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      setCreateOpen(false)
      setForm({ name: '', slug: '', color: '#6b7280', is_terminal: false })
      toast.success('Stage created')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 405) {
        toast.error('Create stage not allowed — check backend URL router configuration (POST /api/v1/pipeline/ is returning 405)')
      } else {
        toast.error('Failed to create stage')
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pipelineService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Stage deleted')
    },
    onError: () => toast.error('Failed to delete stage'),
  })

  const stages = data?.results || []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pipeline Stages</h1>
          <p className="text-xs text-muted-foreground">{stages.length} stages configured</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            Seed Defaults
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-14" />
            </Card>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No pipeline stages</p>
          <p className="text-sm mt-1">Seed the defaults or create stages manually</p>
          <Button className="mt-4" onClick={() => seedMutation.mutate()}>
            <Zap className="h-4 w-4 mr-2" />
            Seed Default Stages
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-4 pb-1">
            <div className="w-5" />
            <div className="w-3" />
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</p>
            </div>
            <div className="w-20" />
            <div className="w-6 text-center">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">#</p>
            </div>
            <div className="w-7" />
          </div>
          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} onDelete={deleteMutation.mutate} />
          ))}
        </div>
      )}

      <SideDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Pipeline Stage"
        mode="create"
        size="md"
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => setCreateOpen(false) },
          {
            label: 'Create Stage',
            loading: createMutation.isPending,
            onClick: () =>
              createMutation.mutate({
                name: form.name,
                slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
                color: form.color,
                is_terminal: form.is_terminal,
                order: stages.length,
              }),
          },
        ]}
        footerAlignment="right"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Stage Name *</Label>
            <Input
              placeholder="e.g. Background Check"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              placeholder="e.g. background-check"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">Auto-generated from name if left empty</p>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-10 rounded border border-input cursor-pointer"
              />
              <Input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_terminal}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_terminal: v }))}
            />
            <Label>Terminal Stage</Label>
          </div>
        </div>
      </SideDrawer>
    </div>
  )
}
