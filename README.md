# backpack.tf Live Listings

React + Vite + Tailwind + shadcn/ui page that streams TF2 listings from the
backpack.tf websocket (`wss://ws.backpack.tf/events`) and stores them in IndexedDB (Dexie).

- **Sell orders on the left, buy orders on the right.**
- **Filters:** name search, item type, sub-category (depends on type: weapon slot,
  cosmetic/taunt class, tool kind, crate/case), quality, price range (keys + ref),
  status (active / sold-removed / all) and sort.
- **Steam image** from the payload's `item.imageUrl`, requested at 184x184 and capped at
  184px, with a border in the item's quality colour (`item.quality.color`).
- **Deletes are never removed from the DB.** A `listing-delete` marks the listing
  `removed` (sold/removed); every listing keeps a price history (listed, price change,
  removed, relisted). The History dialog also shows every recorded listing of the same
  item (name + quality).
- **Prices** shown as `x keys, x refined`, or just `x refined` when there are no keys.
  The key → ref rate used for range filters/sorting is derived from the feed
  (`value.raw`) and can be overridden in the header.

## Run

```bash
npm install
npm run dev
```

If the browser can't connect to backpack.tf directly, run the Node relay and point the app at it:

```bash
npm run relay
VITE_BPTF_WS_URL=ws://localhost:8787 npm run dev
```

The local DB grows continuously (the feed is a firehose); clear it from devtools →
Application → IndexedDB → `bptf-listings` when needed.
