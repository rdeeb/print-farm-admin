import { createServer } from 'http'
import type { Socket } from 'net'
import next from 'next'
import { WebSocketIngestServer } from './src/lib/ws-ingest-server'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      handle(req, res)
    })

    const wsIngest = new WebSocketIngestServer()

    httpServer.on('upgrade', (req, socket, head) => {
      const url = req.url ?? ''
      if (url.startsWith('/api/connectors/ws')) {
        wsIngest.handleUpgrade(req, socket as Socket, head)
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
        socket.destroy()
      }
    })

    const port = parseInt(process.env.PORT ?? '3000', 10)
    httpServer.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`)
    })
  })
  .catch((err: unknown) => {
    console.error('Failed to start Next.js server:', err)
    process.exit(1)
  })
