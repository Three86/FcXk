import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface MultiSelectProps {
  label: string
  options: { value: string; color?: string }[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export function MultiSelect({ label, options, selected, onChange, disabled }: MultiSelectProps) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal" disabled={disabled}>
          <span className="truncate">{selected.length ? `${label}: ${selected.join(', ')}` : `Any ${label.toLowerCase()}`}</span>
          <ChevronDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start">
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {options.map((o) => {
            const id = `${label}-${o.value}`
            return (
              <div key={o.value} className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5">
                <Checkbox id={id} checked={selected.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
                <Label htmlFor={id} className="flex-1 cursor-pointer font-normal" style={o.color ? { color: o.color } : undefined}>
                  {o.value}
                </Label>
              </div>
            )
          })}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
