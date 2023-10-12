import { createServer } from 'http'

import polka from 'polka'
import { WebSocketServer } from 'ws'

import { handler } from '../build/handler.js'
import { msgParse } from '../common/util.js'

import { Life } from './Life.js'

let { PORT = 3000 } = process.env
let server = createServer()

polka({ server })
  .use(handler)
  .listen(PORT, () => {
    console.log(`port: ${PORT}`)
  })

let wss = new WebSocketServer({ server })

let life = new Life()
// TODO: link db
life.sow()

wss.on('connection', ws => {
  ws.alive = true

  ws.on('pong', () => {
    ws.alive = true
  })

  ws.on('error', console.error)

  ws.on('message', data => {
    let [h, b] = msgParse(data + '')
    switch (h) {
      case 'C':
        life.sowR(b.split` `)
        break
    }
  })
})

let ping = setInterval(() => {
  for (let ws of wss.clients) {
    if (!ws.alive) ws.terminate()
    ws.alive = false
    ws.ping()
  }
}, 30000)

let gol = setInterval(() => {
  life.next()
  for (let ws of wss.clients) ws.send('G\n' + life.rle())
}, 50)

wss.on('close', () => {
  clearInterval(ping)
  clearInterval(gol)
})
