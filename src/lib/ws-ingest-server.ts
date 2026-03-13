import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { Socket } from 'net'

export class WebSocketIngestServer {
  private wss: WebSocketServer

  constructor() {
    this.wss = new WebSocketServer({ noServer: true })
    this.wss.on('connection', this.onConnection.bind(this))
  }

  handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
    try {
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit('connection', ws, req)
      })
    } catch (err) {
      console.error('[WS] handleUpgrade error:', err)
      socket.destroy()
    }
  }

  private onConnection(ws: WebSocket, _req: IncomingMessage) {
    // Stub: will be implemented in Feature 3
    ws.close(1013, 'Not yet implemented')
  }
}
