import { RotateCcwIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ITEM_TYPES, QUALITY_COLORS, type ItemType } from '@/lib/bptf'
import { DEFAULT_FILTERS, subcategoriesFor, type Filters } from '@/lib/filters'
import { MultiSelect } from './multi-select'

interface FilterBarProps {
  filters: Filters
  onChange: (f: Filters) => void
}

const QUALITY_OPTIONS = Object.entries(QUALITY_COLORS).map(([value, color]) => ({ value, color }))

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })
  const subOptions = subcategoriesFor(filters.itemType).map((value) => ({ value }))

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <Field label="Search" className="xl:col-span-2">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder="Item name…"
            className="pl-8"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>
      </Field>

      <Field label="Item type">
        <Select
          value={filters.itemType}
          onValueChange={(v) => onChange({ ...filters, itemType: v as ItemType | 'all', subcategories: [] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ITEM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Sub-category">
        <MultiSelect
          label="Sub-category"
          options={subOptions}
          selected={filters.subcategories}
          onChange={(v) => set('subcategories', v)}
          disabled={!subOptions.length}
        />
      </Field>

      <Field label="Quality">
        <MultiSelect label="Quality" options={QUALITY_OPTIONS} selected={filters.qualities} onChange={(v) => set('qualities', v)} />
      </Field>

      <Field label="Price range (keys + ref)" className="xl:col-span-2">
        <div className="flex items-center gap-1.5">
          <PriceInput placeholder="min k" value={filters.minKeys} onChange={(v) => set('minKeys', v)} />
          <PriceInput placeholder="min ref" value={filters.minRef} onChange={(v) => set('minRef', v)} />
          <span className="text-muted-foreground">–</span>
          <PriceInput placeholder="max k" value={filters.maxKeys} onChange={(v) => set('maxKeys', v)} />
          <PriceInput placeholder="max ref" value={filters.maxRef} onChange={(v) => set('maxRef', v)} />
        </div>
      </Field>

      <Field label="Status">
        <Select value={filters.status} onValueChange={(v) => set('status', v as Filters['status'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="removed">Sold / removed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Sort">
        <Select value={filters.sort} onValueChange={(v) => set('sort', v as Filters['sort'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: low → high</SelectItem>
            <SelectItem value="price-desc">Price: high → low</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="flex items-end">
        <Button variant="ghost" className="w-full" onClick={() => onChange(DEFAULT_FILTERS)}>
          <RotateCcwIcon /> Reset filters
        </Button>
      </div>
    </div>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className ?? ''}`}>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  )
}

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      type="number"
      min={0}
      step="any"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2"
    />
  )
}
