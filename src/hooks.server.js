import { nanoid } from 'nanoid'
import { createClient } from 'redis'
import sharp from 'sharp'

import { building } from '$app/environment'
import Life from '$lib/Life.js'
import opts from '$lib/opts.js'
import Player, { ss } from '$lib/Player.js'
import { gwss } from '$lib/server'
import { msgParse } from '$lib/util.js'

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
  if (grid && grid[0] == '\0') {
    console.log('[wss] db -> grid')
    life.grid = Life.desparse(grid)
  } else life.sow()

  let interp = (await client.get('interp')) || '...'
  console.log('[wss] db -> interp :', interp)

  wss.on('connection', ws => {
    ws.id = nanoid()
    ws.alive = true
    ws.player = new Player()

    console.log('[wss] +conn', ws.id)

    if (interp) ws.send('T\n' + interp)

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
    if (!wss.clients.size) return
    wr = false
    await client.set('grid', life.sparse())
    wr = true
  }, opts.dbwrite)

  let loop = true
  let gol = () => {
    const a = Date.now()
    if (wss.clients.size) {
      life.next()
      for (let ws of wss.clients) {
        ws.player.heal()
        ws.send('G\n' + life.sparse())
        if (ws.player.s != ss.idle) ws.send('H\n' + ws.player.h)
        ws.send('X')
      }
    }
    const b = Date.now()
    if (loop) setTimeout(gol, opts.ms - b + a)
  }
  gol()

  let gen = async () => {
    const a = Date.now()
    if (wss.clients.size) {
      let img = await sharp(life.toUi8(), {
        raw: {
          width: opts.size,
          height: opts.size,
          channels: 3,
        },
      })
        .gif()
        .toBuffer()
      img = img.toString('base64')
      console.log('[wss] req interp')
      let req = await fetch(
        'https://replicate-api-proxy.glitch.me/create_n_get',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version:
              '6bc1c7bb0d2a34e413301fee8f7cc728d2d4e75bfab186aa995f63292bda92fc',
            input: {
              image: 'data:image/png;base64,' + img,
              prompt:
                'Interpret the real-world object depicted. Say only the object, avoid sentences. Be as metaphorical, abstract, sarcastic, witty, humorous, and obscure as possible. Focus primarily on shape/form rather than color. Avoid being literal.',
              temperature: 0.69,
            },
          }),
        }
      )
      let { output } = await req.json()
      interp = output.join``.toUpperCase().replace(/ +/g, ' ')
      await client.set('interp', interp)
      console.log('[wss] interp :', interp)
      for (let ws of wss.clients) ws.send('T\n' + interp)
    }
    const b = Date.now()
    if (loop) setTimeout(gen, opts.gen_ms - b + a)
  }
  gen()

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
