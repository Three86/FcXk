import { useEffect, useRef, useState } from 'react'

import { keyRateFromListing, type BptfEvent } from '@/lib/bptf'
import { applyEvents } from '@/lib/db'

const WS_URL = import.meta.env.VITE_BPTF_WS_URL ?? 'wss://ws.backpack.tf/events'
const FLUSH_MS = 1000
const KEY_RATE_STORAGE = 'bptf:keyRate'
const DEFAULT_KEY_RATE = 60

export type FeedStatus = 'connecting' | 'open' | 'closed' | 'paused'

function storedKeyRate(): number {
  try {
    const v = Number(localStorage.getItem(KEY_RATE_STORAGE))
    return v > 0 ? v : DEFAULT_KEY_RATE
  } catch {
    return DEFAULT_KEY_RATE
  }
}

/**
 * Connects to the backpack.tf events websocket, batches events and writes them to IndexedDB.
 * Also derives the current key price (in refined) from listings priced in keys.
 */
export function useBptfFeed(enabled: boolean) {
  const [status, setStatus] = useState<FeedStatus>('connecting')
  const [received, setReceived] = useState(0)
  const [keyRate, setKeyRate] = useState(storedKeyRate)
  const buffer = useRef<BptfEvent[]>([])
  const samples = useRef<number[]>([])

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let retry = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let disposed = false

    const connect = () => {
      setStatus('connecting')
      ws = new WebSocket(WS_URL)
      ws.onopen = () => {
        retry = 0
        setStatus('open')
      }
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          const events: BptfEvent[] = Array.isArray(data) ? data : [data]
          buffer.current.push(...events)
        } catch {
          // ignore malformed frames
        }
      }
      ws.onclose = () => {
        if (disposed) return
        setStatus('closed')
        reconnectTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++))
      }
      ws.onerror = () => ws?.close()
    }

    const flushNow = () => {
      const events = buffer.current
      if (!events.length) return
      buffer.current = []
      setReceived((n) => n + events.length)

      for (const e of events) {
        const rate = e.event === 'listing-update' && e.payload ? keyRateFromListing(e.payload) : null
        if (rate) samples.current.push(rate)
      }
      if (samples.current.length) {
        samples.current = samples.current.slice(-101)
        const sorted = [...samples.current].sort((a, b) => a - b)
        const median = Math.round(sorted[Math.floor(sorted.length / 2)] * 100) / 100
        setKeyRate(median)
        try {
          localStorage.setItem(KEY_RATE_STORAGE, String(median))
        } catch {
          // storage unavailable
        }
      }

      applyEvents(events).catch((err) => console.error('Failed to store events', err))
    }
    const flush = setInterval(flushNow, FLUSH_MS)

    connect()
    return () => {
      disposed = true
      clearTimeout(reconnectTimer)
      clearInterval(flush)
      ws?.close()
      flushNow()
    }
  }, [enabled])

  return { status: enabled ? status : ('paused' as FeedStatus), received, keyRate }
}
