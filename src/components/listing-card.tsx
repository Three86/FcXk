import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/bptf'
import type { StoredListing } from '@/lib/db'
import { cn } from '@/lib/utils'
import { ItemImage } from './item-image'
import { PriceHistoryDialog } from './price-history-dialog'

function ago(ms: number) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export const ListingCard = memo(function ListingCard({ listing }: { listing: StoredListing }) {
  const removed = listing.status === 'removed'
  const priceChanges = listing.history.filter((p) => p.event === 'price-change').length

  return (
    <div className={cn('bg-card flex gap-3 rounded-lg border p-3 transition-opacity', removed && 'opacity-60')}>
      <ItemImage
        src={listing.image}
        alt={listing.name}
        borderColor={listing.quality.color}
        particleImage={listing.particleImage}
        className="w-20 sm:w-24"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold" style={{ color: listing.quality.color }} title={listing.name}>
            {listing.name}
          </p>
          {removed ? <Badge variant="destructive">Sold / removed</Badge> : <Badge variant="secondary">Active</Badge>}
        </div>
        <p className="text-lg leading-tight font-bold">{formatPrice(listing.keys, listing.metal)}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" style={{ borderColor: listing.quality.color, color: listing.quality.color }}>
            {listing.quality.name}
          </Badge>
          <Badge variant="outline">{listing.itemType}</Badge>
          {listing.subcategories.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className="text-muted-foreground">
              {s}
            </Badge>
          ))}
          {priceChanges > 0 && <Badge variant="secondary">{priceChanges} price change{priceChanges > 1 ? 's' : ''}</Badge>}
        </div>
        {listing.details && <p className="text-muted-foreground line-clamp-2 text-xs">{listing.details}</p>}
        <div className="text-muted-foreground mt-auto flex items-center justify-between gap-2 text-xs">
          <a
            href={`https://backpack.tf/profiles/${listing.userId}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-1.5 hover:underline"
          >
            {listing.userAvatar && <img src={listing.userAvatar} alt="" className="size-4 rounded-full" />}
            <span className="truncate">{listing.userName ?? listing.userId}</span>
          </a>
          <span className="flex shrink-0 items-center gap-1">
            {ago(listing.updatedAt)}
            <PriceHistoryDialog listing={listing} />
          </span>
        </div>
      </div>
    </div>
  )
})
