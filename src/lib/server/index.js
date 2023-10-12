import { WebSocketServer } from 'ws'

export const gwss = Symbol.for('gwss')

export const globWS = () => {
  let wss = new WebSocketServer({ noServer: true })
  globalThis[gwss] = wss
  return wss
}

export const globWSUp = (req, sock, head) => {
  let pn = req.url?.split('?')[0]
  if (pn != '/ws') return
  let wss = globalThis[gwss]
  wss.handleUpgrade(req, sock, head, ws => {
    wss.emit('connection', ws, req)
  })
}
