import { useLiveQuery } from 'dexie-react-hooks'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Intent } from '@/lib/bptf'
import { queryListings, type Filters } from '@/lib/filters'
import { cn } from '@/lib/utils'
import { ListingCard } from './listing-card'

const LIMIT = 150

interface ListingColumnProps {
  intent: Intent
  filters: Filters
  keyRate: number
}

export function ListingColumn({ intent, filters, keyRate }: ListingColumnProps) {
  const rows = useLiveQuery(() => queryListings(intent, filters, keyRate, LIMIT), [intent, filters, keyRate])
  const isSell = intent === 'sell'

  return (
    <Card className="flex min-h-0 flex-col gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className={cn('text-xl', isSell ? 'text-emerald-400' : 'text-sky-400')}>
          {isSell ? 'Sell orders' : 'Buy orders'}
        </CardTitle>
        <CardDescription>
          {rows === undefined ? 'Loading…' : `Showing ${rows.length}${rows.length === LIMIT ? '+' : ''} listings`}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-2">
        <ScrollArea className="h-[calc(100vh-22rem)] min-h-96 px-2">
          <div className="flex flex-col gap-2 pb-2">
            {rows?.map((l) => <ListingCard key={l.id} listing={l} />)}
            {rows?.length === 0 && (
              <p className="text-muted-foreground py-12 text-center text-sm">No listings match your filters yet.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
