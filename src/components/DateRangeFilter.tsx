import { X } from 'lucide-react'
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
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => onFromChange(e.target.value)}
        placeholder="From"
        className="h-9 w-[calc(50%-6px)] sm:w-36 text-xs"
      />
      <Input
        type="date"
        value={toDate}
        onChange={(e) => onToChange(e.target.value)}
        placeholder="To"
        className="h-9 w-[calc(50%-6px)] sm:w-36 text-xs"
      />
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
