import { createServer } from 'http'

import polka from 'polka'
import { WebSocketServer } from 'ws'

import { handler } from '../build/handler'

let { PORT = 3000 } = process.env
let server = createServer()

polka({ server })
  .get('/ws', (req, res) => {
    console.log('ws')
  })
  .use(handler)
  .listen(PORT, () => {
    console.log(`port: ${PORT}`)
  })

const wss = new WebSocketServer({ server })

wss.on('connection', function connection(ws) {
  ws.on('error', console.error)

  ws.on('message', function message(data) {
    console.log('received: %s', data)
  })

  ws.send('something')
})
