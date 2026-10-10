import Dexie from 'dexie'

import type { Intent, ItemType } from './bptf'
import { toRefined } from './bptf'
import { db, type StoredListing } from './db'

export interface Filters {
  search: string
  status: 'active' | 'removed' | 'all'
  itemType: ItemType | 'all'
  subcategories: string[]
  qualities: string[]
  minKeys: string
  minRef: string
  maxKeys: string
  maxRef: string
  sort: 'newest' | 'price-asc' | 'price-desc'
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  status: 'active',
  itemType: 'all',
  subcategories: [],
  qualities: [],
  minKeys: '',
  minRef: '',
  maxKeys: '',
  maxRef: '',
  sort: 'newest',
}

const CLASSES = ['All-Class', 'Scout', 'Soldier', 'Pyro', 'Demoman', 'Heavy', 'Engineer', 'Medic', 'Sniper', 'Spy']

export const SUBCATEGORIES: Partial<Record<ItemType, string[]>> = {
  Weapon: ['Primary', 'Secondary', 'Melee', 'PDA', 'Building'],
  Cosmetic: CLASSES,
  Taunt: CLASSES,
  Tool: ['Paint', 'Killstreak Kit', 'Fabricator', 'Strangifier', 'Unusualifier', 'Strange Part', 'Tag', 'Chemistry Set', 'Consumable', 'Other'],
  Crate: ['Crate', 'Case'],
}

export function subcategoriesFor(type: ItemType | 'all'): string[] {
  if (type !== 'all') return SUBCATEGORIES[type] ?? []
  return [...new Set(Object.values(SUBCATEGORIES).flat())]
}

const num = (s: string) => (s.trim() === '' ? null : Number(s) || 0)

/** Price bound in refined, or null when neither keys nor ref is set. */
function bound(keys: string, ref: string, keyRate: number): number | null {
  const k = num(keys)
  const r = num(ref)
  if (k === null && r === null) return null
  return toRefined(k ?? 0, r ?? 0, keyRate)
}

export function makeMatcher(f: Filters, keyRate: number) {
  const search = f.search.trim().toLowerCase()
  const min = bound(f.minKeys, f.minRef, keyRate)
  const max = bound(f.maxKeys, f.maxRef, keyRate)
  const subs = new Set(f.subcategories)
  const quals = new Set(f.qualities)

  return (l: StoredListing) => {
    if (f.status !== 'all' && l.status !== f.status) return false
    if (f.itemType !== 'all' && l.itemType !== f.itemType) return false
    if (subs.size && !l.subcategories.some((s) => subs.has(s))) return false
    if (quals.size && !quals.has(l.quality.name)) return false
    if (search && !l.nameLower.includes(search)) return false
    if (min !== null || max !== null) {
      const price = toRefined(l.keys, l.metal, keyRate)
      if (min !== null && price < min) return false
      if (max !== null && price > max) return false
    }
    return true
  }
}

export async function queryListings(intent: Intent, f: Filters, keyRate: number, limit = 150) {
  const matches = makeMatcher(f, keyRate)
  const coll = db.listings
    .where('[intent+updatedAt]')
    .between([intent, Dexie.minKey], [intent, Dexie.maxKey])
    .reverse()
    .filter(matches)

  if (f.sort === 'newest') return coll.limit(limit).toArray()

  const rows = await coll.toArray()
  const dir = f.sort === 'price-asc' ? 1 : -1
  rows.sort((a, b) => dir * (toRefined(a.keys, a.metal, keyRate) - toRefined(b.keys, b.metal, keyRate)))
  return rows.slice(0, limit)
}
