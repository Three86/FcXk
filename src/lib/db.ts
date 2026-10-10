import Dexie, { type EntityTable } from 'dexie'

import {
  categorise,
  qualityColor,
  steamImage,
  type BptfEvent,
  type BptfListing,
  type BptfQuality,
  type Intent,
  type ItemType,
} from './bptf'

export type ListingStatus = 'active' | 'removed'

export interface PricePoint {
  at: number
  keys: number
  metal: number
  event: 'listed' | 'price-change' | 'removed' | 'relisted'
}

export interface StoredListing {
  id: string
  intent: Intent
  status: ListingStatus
  /** Groups listings of the same item (name + quality) for item price history. */
  sku: string
  name: string
  nameLower: string
  quality: BptfQuality & { color: string }
  itemType: ItemType
  subcategories: string[]
  keys: number
  metal: number
  image: string | null
  particleImage?: string
  userId: string
  userName?: string
  userAvatar?: string
  details?: string
  listedAt?: number
  bumpedAt?: number
  firstSeen: number
  updatedAt: number
  removedAt?: number
  history: PricePoint[]
  payload: BptfListing
}

export const db = new Dexie('bptf-listings') as Dexie & {
  listings: EntityTable<StoredListing, 'id'>
}

db.version(1).stores({
  listings: 'id, intent, status, sku, itemType, updatedAt, [intent+updatedAt]',
})

function fromPayload(p: BptfListing, now: number): Omit<StoredListing, 'status' | 'history' | 'firstSeen'> {
  const item = p.item ?? {}
  const name = item.name ?? item.marketName ?? item.baseName ?? 'Unknown item'
  const quality = item.quality ?? { id: 6, name: 'Unique' }
  const { itemType, subcategories } = categorise(item)
  return {
    id: p.id,
    intent: p.intent === 'buy' ? 'buy' : 'sell',
    sku: `${quality.id}:${name}`,
    name,
    nameLower: name.toLowerCase(),
    quality: { ...quality, color: qualityColor(quality) },
    itemType,
    subcategories,
    keys: p.currencies?.keys ?? 0,
    metal: p.currencies?.metal ?? 0,
    image: steamImage(item.imageUrl),
    particleImage: item.particle?.image,
    userId: p.user?.id ?? p.steamid ?? 'unknown',
    userName: p.user?.name,
    userAvatar: p.user?.avatar,
    details: p.details,
    listedAt: p.listedAt,
    bumpedAt: p.bumpedAt,
    updatedAt: now,
    payload: p,
  }
}

/**
 * Apply a batch of websocket events in one transaction.
 * Deletes never remove rows: the listing is flagged `removed` (sold/removed) and its
 * price history is kept.
 */
export async function applyEvents(events: BptfEvent[]) {
  // Collapse to the last event per listing id, keeping order.
  const latest = new Map<string, BptfEvent>()
  for (const e of events) if (e?.payload?.id) latest.set(e.payload.id, e)
  if (!latest.size) return

  await db.transaction('rw', db.listings, async () => {
    const ids = [...latest.keys()]
    const existing = await db.listings.bulkGet(ids)
    const now = Date.now()
    const out: StoredListing[] = []

    ids.forEach((id, i) => {
      const e = latest.get(id)!
      const prev = existing[i]
      const next = fromPayload(e.payload, now)

      if (e.event === 'listing-delete') {
        if (prev?.status === 'removed') return
        const base = prev ?? { ...next, firstSeen: now, history: [] as PricePoint[] }
        out.push({
          ...base,
          status: 'removed',
          removedAt: now,
          updatedAt: now,
          history: [...base.history, { at: now, keys: base.keys, metal: base.metal, event: 'removed' }],
        })
        return
      }

      if (e.event !== 'listing-update') return

      if (!prev) {
        out.push({
          ...next,
          status: 'active',
          firstSeen: now,
          history: [{ at: now, keys: next.keys, metal: next.metal, event: 'listed' }],
        })
        return
      }

      const history = [...prev.history]
      if (prev.status === 'removed') history.push({ at: now, keys: next.keys, metal: next.metal, event: 'relisted' })
      else if (prev.keys !== next.keys || prev.metal !== next.metal)
        history.push({ at: now, keys: next.keys, metal: next.metal, event: 'price-change' })

      out.push({ ...prev, ...next, status: 'active', removedAt: undefined, history })
    })

    if (out.length) await db.listings.bulkPut(out)
  })
}
