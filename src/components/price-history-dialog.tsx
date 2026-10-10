import { useLiveQuery } from 'dexie-react-hooks'
import { HistoryIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/bptf'
import { db, type StoredListing } from '@/lib/db'
import { ItemImage } from './item-image'

const EVENT_LABEL = {
  listed: 'Listed',
  'price-change': 'Price changed',
  removed: 'Sold / removed',
  relisted: 'Relisted',
} as const

const time = (ms: number) => new Date(ms).toLocaleString()

export function PriceHistoryDialog({ listing }: { listing: StoredListing }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <HistoryIcon /> History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle style={{ color: listing.quality.color }}>{listing.name}</DialogTitle>
          <DialogDescription>Price history recorded in your local database.</DialogDescription>
        </DialogHeader>
        <HistoryBody listing={listing} />
      </DialogContent>
    </Dialog>
  )
}

function HistoryBody({ listing }: { listing: StoredListing }) {
  // Other listings of the same item (name + quality) give an item-level price history.
  const related = useLiveQuery(
    () => db.listings.where('sku').equals(listing.sku).reverse().sortBy('updatedAt'),
    [listing.sku],
  )

  return (
    <div className="flex gap-4">
      <ItemImage
        src={listing.image}
        alt={listing.name}
        borderColor={listing.quality.color}
        particleImage={listing.particleImage}
        className="hidden w-28 sm:block"
      />
      <ScrollArea className="h-80 flex-1 pr-3">
        <h4 className="mb-2 text-sm font-semibold">This listing</h4>
        <ol className="space-y-1.5 text-sm">
          {[...listing.history].reverse().map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">{time(p.at)}</span>
              <span className="flex items-center gap-2">
                <Badge variant={p.event === 'removed' ? 'destructive' : 'secondary'}>{EVENT_LABEL[p.event]}</Badge>
                <span className="font-medium">{formatPrice(p.keys, p.metal)}</span>
              </span>
            </li>
          ))}
        </ol>

        <Separator className="my-4" />

        <h4 className="mb-2 text-sm font-semibold">All recorded listings of this item</h4>
        <ol className="space-y-1.5 text-sm">
          {related?.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground truncate text-xs">
                {time(l.updatedAt)} · {l.userName ?? l.userId}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{l.intent}</Badge>
                {l.status === 'removed' && <Badge variant="destructive">sold/removed</Badge>}
                <span className="font-medium">{formatPrice(l.keys, l.metal)}</span>
              </span>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}
