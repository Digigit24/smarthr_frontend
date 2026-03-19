import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onClear,
}: {
  fromDate: string
  toDate: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onClear: () => void
}) {
  const hasFilter = fromDate || toDate

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">From</Label>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-9 w-36 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">To</Label>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          className="h-9 w-36 text-xs"
        />
      </div>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
