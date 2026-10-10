// Types + helpers for the backpack.tf websocket feed (wss://ws.backpack.tf/events).
// The feed sends JSON arrays of `{ id, event, payload }` where payload is a v2 listing.

export type Intent = 'buy' | 'sell'

export interface BptfQuality {
  id: number
  name: string
  color?: string
}

export interface BptfItem {
  appid?: number
  defindex?: number
  id?: string
  name?: string
  baseName?: string
  marketName?: string
  imageUrl?: string
  quality?: BptfQuality
  elevatedQuality?: BptfQuality
  slot?: string
  class?: string[]
  craftable?: boolean
  tradable?: boolean
  australium?: boolean
  festivized?: boolean
  killstreakTier?: number
  particle?: { id: number; name: string; image?: string }
  paint?: { id: number; name: string; color?: string }
  [key: string]: unknown
}

export interface BptfListing {
  id: string
  steamid?: string
  appid?: number
  intent: Intent
  currencies?: { keys?: number; metal?: number }
  value?: { raw?: number; short?: string; long?: string }
  details?: string
  listedAt?: number
  bumpedAt?: number
  count?: number
  item?: BptfItem
  user?: { id: string; name?: string; avatar?: string }
}

export interface BptfEvent {
  id: string
  event: 'listing-update' | 'listing-delete' | string
  payload: BptfListing
}

// Fallback colours (TF2 quality colours) when a payload has none.
export const QUALITY_COLORS: Record<string, string> = {
  Normal: '#B2B2B2',
  Genuine: '#4D7455',
  Vintage: '#476291',
  Unusual: '#8650AC',
  Unique: '#FFD700',
  Community: '#70B04A',
  Valve: '#A50F79',
  'Self-Made': '#70B04A',
  Strange: '#CF6A32',
  Haunted: '#38F3AB',
  "Collector's": '#AA0000',
  'Decorated Weapon': '#FAFAFA',
}

export function qualityColor(q?: BptfQuality): string {
  if (!q) return QUALITY_COLORS.Unique
  const c = q.color ?? QUALITY_COLORS[q.name] ?? QUALITY_COLORS.Unique
  return c.startsWith('#') ? c : `#${c}`
}

// ---------- prices ----------

const round2 = (n: number) => Math.round(n * 100) / 100

/** "2 keys, 13.55 refined" / "13.55 refined" / "1 key" */
export function formatPrice(keys = 0, metal = 0): string {
  const parts: string[] = []
  if (keys > 0) parts.push(`${round2(keys)} ${keys === 1 ? 'key' : 'keys'}`)
  if (metal > 0 || keys <= 0) parts.push(`${round2(metal)} refined`)
  return parts.join(', ')
}

export function toRefined(keys: number, metal: number, keyRate: number) {
  return keys * keyRate + metal
}

/** backpack.tf sends value.raw in refined, so a listing priced in keys reveals the key rate. */
export function keyRateFromListing(l: BptfListing): number | null {
  const keys = l.currencies?.keys ?? 0
  const metal = l.currencies?.metal ?? 0
  const raw = l.value?.raw
  if (!raw || keys < 1) return null
  const rate = (raw - metal) / keys
  return rate > 5 && rate < 1000 ? rate : null
}

// ---------- images ----------

const MAX_IMG = 184

/** Ask Steam's CDN for a 184x184 (fit) version of economy images. */
export function steamImage(url?: string): string | null {
  if (!url) return null
  const m = url.match(/^(https?:\/\/[^/]+\/economy\/image\/[^/]+)/)
  if (m) return `${m[1]}/${MAX_IMG}fx${MAX_IMG}f`
  return url
}

// ---------- categorisation ----------

export const ITEM_TYPES = ['Weapon', 'Cosmetic', 'Taunt', 'Tool', 'Crate', 'Key', 'Other'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

const TF2_CLASSES = ['Scout', 'Soldier', 'Pyro', 'Demoman', 'Heavy', 'Engineer', 'Medic', 'Sniper', 'Spy']
const WEAPON_SLOTS: Record<string, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  melee: 'Melee',
  pda: 'PDA',
  pda2: 'PDA',
  building: 'Building',
}

function toolSubcategory(name: string): string {
  const rules: [RegExp, string][] = [
    [/paint/i, 'Paint'],
    [/fabricator/i, 'Fabricator'],
    [/killstreak.*kit/i, 'Killstreak Kit'],
    [/strangifier/i, 'Strangifier'],
    [/unusualifier/i, 'Unusualifier'],
    [/strange part/i, 'Strange Part'],
    [/(name|description) tag/i, 'Tag'],
    [/chemistry set/i, 'Chemistry Set'],
    [/ticket|noise maker|backpack expander|gift/i, 'Consumable'],
  ]
  return rules.find(([re]) => re.test(name))?.[1] ?? 'Other'
}

function classSubcategories(classes?: string[]): string[] {
  if (!classes?.length || classes.length >= TF2_CLASSES.length) return ['All-Class']
  return classes.map((c) => c.charAt(0).toUpperCase() + c.slice(1))
}

export function categorise(item: BptfItem = {}): { itemType: ItemType; subcategories: string[] } {
  const name = item.baseName ?? item.name ?? ''
  const slot = item.slot?.toLowerCase()

  if (/\bkey\b/i.test(name) && !/kit/i.test(name)) return { itemType: 'Key', subcategories: [] }
  if (/\b(crate|case|munition)\b/i.test(name)) {
    return { itemType: 'Crate', subcategories: [/case/i.test(name) ? 'Case' : 'Crate'] }
  }
  if (slot && WEAPON_SLOTS[slot]) return { itemType: 'Weapon', subcategories: [WEAPON_SLOTS[slot]] }
  if (slot === 'taunt' || /^taunt:/i.test(name)) return { itemType: 'Taunt', subcategories: classSubcategories(item.class) }
  if (slot === 'misc' || slot === 'head') return { itemType: 'Cosmetic', subcategories: classSubcategories(item.class) }
  if (slot === 'action' || slot === 'tool' || !slot) {
    const sub = toolSubcategory(name)
    if (sub !== 'Other' || slot) return { itemType: 'Tool', subcategories: [sub] }
  }
  return { itemType: 'Other', subcategories: [] }
}
