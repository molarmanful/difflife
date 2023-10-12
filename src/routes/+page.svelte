<script>
  import '@unocss/reset/tailwind-compat.css'
  import 'uno.css'
  import '../app.postcss'

  import { onMount } from 'svelte'

  import opts from '../../common/opts.js'
  import { deRLE, msgParse } from '../../common/util.js'

  let canvas
  let clk = false
  let mouse = { x: 0, y: 0 }
  let loaded = false

  let cvclk = () => {}

  onMount(() => {
    canvas.style.width = canvas.style.height = `${opts.size * opts.scale}px`
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    let imgd = ctx.createImageData(opts.size, opts.size)

    loaded = true

    let ws = new WebSocket(
      `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}`
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
          imgd.data.set(deRLE(b))
          ctx.putImageData(imgd, 0, 0)
          if (clk) cvclk(mouse)
          break
      }
    }

    ws.onclose = () => {
      console.log('close')
    }
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
  on:mouseup={() => (clk = false)}
/>

<main
  class="{loaded
    ? 'opacity-100'
    : 'opacity-0'} transition-opacity-400 screen flex justify-center items-center"
>
  <canvas
    bind:this={canvas}
    class="border-(1 white) image-render-pixel"
    height={opts.size}
    width={opts.size}
    on:click={cvclk}
    on:mousedown={() => (clk = true)}
  />
</main>
