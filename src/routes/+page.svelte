<script>
  import '@unocss/reset/tailwind-compat.css'
  import 'uno.css'
  import '../app.postcss'

  import { onMount } from 'svelte'
  import * as twgl from 'twgl.js'

  import Draw from '$lib/Draw.js'
  import Life from '$lib/Life.js'
  import opts from '$lib/opts.js'
  import { msgParse } from '$lib/util.js'

  let canvas
  let clk = false
  let unclk = false
  let mouse = { x: 0, y: 0 }
  let loaded = false
  let cursor = 'cursor-pointer'
  let health = opts.health
  $: hbar = '#'.repeat(~~health) + '*'.repeat(Math.ceil(health % 1))
  let ws

  let cvclk = () => {}

  onMount(() => {
    canvas.style.width = canvas.style.height = `${opts.size * opts.scale}px`
    let gl = canvas.getContext('webgl')

    let draw = new Draw(gl)

    ws = new WebSocket(
      `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
    )

    ws.onopen = () => {
      console.log('open')

      cvclk = () => {
        let { left, top } = canvas.getBoundingClientRect()
        let { x, y } = mouse
        ws.send(`C\n${(x - left) / opts.scale} ${(y - top) / opts.scale}`)
      }
    }

    ws.onmessage = ({ data }) => {
      let [h, b] = msgParse(data)
      switch (h) {
        case 'G':
          draw.draw(Life.dePx(b))
          break

        case 'H':
          health = +b
          cursor = health <= 0 ? 'cursor-none' : 'cursor-pointer'
          break

        case 'X':
          if (unclk) {
            ws.send('UC')
            unclk = false
          } else if (clk) cvclk(mouse)
          break
      }
    }

    ws.onclose = () => {
      console.log('close')
    }

    loaded = true
  })
</script>

<svelte:head>
  <title>RORSCHACH</title>
</svelte:head>

<svelte:window
  on:mousemove={({ clientX, clientY }) => {
    mouse.x = clientX
    mouse.y = clientY
  }}
  on:mouseup={() => {
    clk = false
    unclk = true
  }}
/>

<main
  class="{loaded
    ? 'opacity-100'
    : 'opacity-0'} transition-opacity-400 screen flex justify-center items-center"
>
  <div class="flex flex-col">
    <div class="flex mb-2">
      <span>{hbar + '·'.repeat(opts.health - hbar.length)}</span>
    </div>
    <canvas
      bind:this={canvas}
      class="border-(1 white) image-render-pixel {cursor}"
      height={opts.size}
      width={opts.size}
      on:mousedown={() => (clk = true)}
    />
  </div>
</main>
