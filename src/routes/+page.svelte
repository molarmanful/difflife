<script>
  import '@unocss/reset/tailwind-compat.css'
  import 'uno.css'
  import '../app.postcss'

  import { onMount } from 'svelte'

  import Draw from '$lib/Draw.js'
  import lev from '$lib/lev.js'
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
  let interp = ''
  $: hbar = '#'.repeat(~~health) + '*'.repeat(Math.ceil(health % 1))
  let ws

  let cvclk = () => {}

  let steps = []
  let lnxt = () => {
    if (steps.length) {
      interp = steps.pop()
      setTimeout(lnxt)
    }
  }

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

        case '?':
          interp += '\n\n[ANALYZING...]'
          break

        case 'T':
          steps = lev(interp, b)
          lnxt()
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
  <div
    style:max-width="{opts.size * opts.scale}px"
    class="h-full flex-(~ col) items-center"
  >
    <div class="flex-(~ 1) flex-col mb-4">
      <span class="mt-auto">
        {hbar + '·'.repeat(opts.health - hbar.length)}
      </span>
    </div>
    <canvas
      bind:this={canvas}
      class="border-(1 black) image-render-pixel {cursor}"
      height={opts.size}
      width={opts.size}
      on:mousedown={() => (clk = true)}
    />
    <div class="mt-4 mb-16 hyphens-auto flex-1">
      <p class="ws-pre-wrap">{interp}</p>
    </div>
  </div>
</main>
