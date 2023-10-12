import { Life } from './lib/server/Life.js'

import { building } from '$app/environment'
import { gwss } from '$lib/server/index.js'
import { msgParse } from '$lib/util.js'

let loaded = false
const startWSS = () => {
  if (loaded) return
  const wss = globalThis[gwss]
  if (!wss) return

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

  loaded = true
}

export const handle = async ({ event, resolve }) => {
  startWSS()
  if (!building) {
    let wss = globalThis[gwss]
    if (wss) event.locals.wss = wss
  }
  return await resolve(event, {
    filterSerializedResponseHeaders: name => name === 'content-type',
  })
}
