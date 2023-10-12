<script>
  import '@unocss/reset/tailwind-compat.css'
  import 'uno.css'
  import '../app.postcss'

  import { onMount } from 'svelte'

  import opts from '../../common/opts.js'
  import { deRLE, msgParse } from '../../common/util.js'

  let canvas

  let cvclk = () => {}

  onMount(() => {
    canvas.style.width = canvas.style.height = `${opts.size * opts.scale}px`
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    let imgd = ctx.createImageData(opts.size, opts.size)

    let ws = new WebSocket(
      `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}`
    )

    ws.onopen = () => {
      console.log('open')
      cvclk = ({ clientX, clientY }) => {
        let { left, top } = canvas.getBoundingClientRect()
        ws.send(`C\n${clientX - left} ${clientY - top}`)
      }
    }

    ws.onmessage = ({ data }) => {
      let [h, b] = msgParse(data)
      switch (h) {
        case 'G':
          console.log(deRLE(b))
          imgd.data.set(deRLE(b))
          ctx.putImageData(imgd, 0, 0)
          break
      }
    }

    ws.onclose = () => {
      console.log('close')
    }
  })
</script>

<svelte:head>
  <title>DIFFLIFE</title>
</svelte:head>

<main class="screen flex justify-center items-center">
  <canvas
    class="border-(1 white) image-render-pixel"
    bind:this={canvas}
    height={opts.size}
    width={opts.size}
    on:click={cvclk}
  />
</main>
