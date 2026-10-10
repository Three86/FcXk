import { useDeferredValue, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PauseIcon, PlayIcon } from 'lucide-react'

import { FilterBar } from '@/components/filter-bar'
import { ListingColumn } from '@/components/listing-column'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBptfFeed, type FeedStatus } from '@/hooks/use-bptf-feed'
import { db } from '@/lib/db'
import { DEFAULT_FILTERS, type Filters } from '@/lib/filters'

const STATUS_STYLE: Record<FeedStatus, string> = {
  open: 'bg-emerald-500',
  connecting: 'bg-amber-500 animate-pulse',
  closed: 'bg-red-500',
  paused: 'bg-zinc-500',
}

export default function App() {
  const [live, setLive] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [keyRateOverride, setKeyRateOverride] = useState('')
  const feed = useBptfFeed(live)

  const keyRate = Number(keyRateOverride) > 0 ? Number(keyRateOverride) : feed.keyRate
  const deferredFilters = useDeferredValue(filters)
  const stored = useLiveQuery(() => db.listings.count(), [])

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">backpack.tf Live Listings</h1>
          <p className="text-muted-foreground text-sm">Streaming from the backpack.tf websocket, stored locally in IndexedDB.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="gap-2 py-1">
            <span className={`size-2 rounded-full ${STATUS_STYLE[feed.status]}`} />
            {feed.status}
          </Badge>
          <Badge variant="secondary" className="py-1">
            {feed.received.toLocaleString()} events · {(stored ?? 0).toLocaleString()} stored
          </Badge>
          <div className="flex items-center gap-2">
            <Label htmlFor="key-rate" className="text-muted-foreground text-xs whitespace-nowrap">
              1 key =
            </Label>
            <Input
              id="key-rate"
              type="number"
              min={0}
              step="any"
              className="h-8 w-24"
              placeholder={String(feed.keyRate)}
              value={keyRateOverride}
              onChange={(e) => setKeyRateOverride(e.target.value)}
              title="Used for price range filtering & sorting. Leave blank to use the rate derived from the feed."
            />
            <span className="text-muted-foreground text-xs">ref</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLive((v) => !v)}>
            {live ? <PauseIcon /> : <PlayIcon />}
            {live ? 'Pause feed' : 'Resume feed'}
          </Button>
        </div>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <main className="grid flex-1 gap-4 md:grid-cols-2">
        <ListingColumn intent="sell" filters={deferredFilters} keyRate={keyRate} />
        <ListingColumn intent="buy" filters={deferredFilters} keyRate={keyRate} />
      </main>
    </div>
  )
}
