// Optional local relay: connects to backpack.tf with Node (no browser Origin header) and
// re-broadcasts every frame to browsers on ws://localhost:8787.
// Use it if the browser can't connect directly:
//   npm run relay   and   VITE_BPTF_WS_URL=ws://localhost:8787 npm run dev
import WebSocket, { WebSocketServer } from 'ws'

const PORT = Number(process.env.RELAY_PORT ?? 8787)
const UPSTREAM = 'wss://ws.backpack.tf/events'
const wss = new WebSocketServer({ port: PORT })

function connect() {
  const ws = new WebSocket(UPSTREAM)
  ws.on('open', () => console.log('websocket running'))
  ws.on('message', (data) => {
    for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(data.toString())
  })
  ws.on('close', () => setTimeout(connect, 3000))
  ws.on('error', (err) => console.error('upstream error:', err.message))
}

connect()
console.log(`relay listening on ws://localhost:${PORT}`)
