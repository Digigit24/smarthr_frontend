import { X, CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <>
      <div className="relative">
        {!fromDate && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-muted-foreground pointer-events-none z-10">
            <CalendarDays className="h-3 w-3" />
            From
          </span>
        )}
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className={`h-9 w-[calc(50%-6px)] min-[400px]:w-36 text-xs ${!fromDate ? '[&::-webkit-datetime-edit]:invisible' : ''}`}
        />
      </div>
      <div className="relative">
        {!toDate && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-muted-foreground pointer-events-none z-10">
            <CalendarDays className="h-3 w-3" />
            To
          </span>
        )}
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          className={`h-9 w-[calc(50%-6px)] min-[400px]:w-36 text-xs ${!toDate ? '[&::-webkit-datetime-edit]:invisible' : ''}`}
        />
      </div>
      {hasFilter && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onClear}
          title="Clear dates"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </>
  )
}
