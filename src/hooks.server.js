import { nanoid } from 'nanoid'
import { createClient } from 'redis'

import { building } from '$app/environment'
import Life from '$lib/Life.js'
import opts from '$lib/opts.js'
import Player, { ss } from '$lib/Player.js'
import { gwss } from '$lib/server'
import { degrid, msgParse } from '$lib/util.js'

let loaded = false
const startWSS = async () => {
  if (loaded) return
  const wss = globalThis[gwss]
  console.log('[wss] start')
  if (!wss) return

  let client = createClient({
    url: process.env.REDIS_URL,
    socket: { family: 6 },
  })
  client.on('error', console.error)
  await client.connect()
  console.log('[wss] +db')

  let life = new Life()
  let grid = await client.get('grid')
  if (grid) {
    console.log('[wss] db -> grid')
    life.grid = degrid(grid, life.grid.n)
  } else life.sow()

  wss.on('connection', ws => {
    ws.id = nanoid()
    ws.alive = true
    ws.player = new Player()

    console.log('[wss] +conn', ws.id)

    ws.on('pong', () => {
      ws.alive = true
    })

    ws.on('error', console.error)

    ws.on('message', data => {
      let [h, b] = msgParse(data + '')
      switch (h) {
        case 'UC':
          ws.player.UC()
          break
        case 'C':
          ws.player.C(() =>
            life.sowR(
              b.split` `.map(x => +x),
              ws.player.h
            )
          )
          break
      }
    })
  })

  let ping = setInterval(() => {
    for (let ws of wss.clients) {
      if (!ws.alive) {
        ws.terminate()
        console.log('[wss] -conn', ws.id)
      }
      ws.alive = false
      ws.ping()
    }
  }, 10000)

  let wr = true
  let dbwrite = setInterval(async () => {
    if (!wr) return
    wr = false
    await client.set('grid', life.rle())
    wr = true
    console.log('[wss] grid -> db')
  }, opts.dbwrite)

  let loop = true
  let gol = () => {
    const a = Date.now()
    life.next()
    for (let ws of wss.clients) {
      ws.player.heal()
      ws.send('G\n' + life.rle())
      if (ws.player.s != ss.idle) ws.send('H\n' + ws.player.h)
      ws.send('X')
    }
    const b = Date.now()
    if (loop) setTimeout(gol, opts.ms - b + a)
  }
  gol()

  wss.on('close', () => {
    clearInterval(ping)
    clearInterval(dbwrite)
    loop = false
  })

  loaded = true
}

export const handle = async ({ event, resolve }) => {
  await startWSS()
  if (!building) {
    let wss = globalThis[gwss]
    if (wss) event.locals.wss = wss
  }
  return await resolve(event, {
    filterSerializedResponseHeaders: name => name == 'content-type',
  })
}
