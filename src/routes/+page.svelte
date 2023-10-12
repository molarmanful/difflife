<script>
  import { onMount } from 'svelte'

  import opts from '../../common/opts.js'

  import { deRLE } from '$lib/util'

  let msg = ''

  onMount(() => {
    let ws = new WebSocket(
      `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}`
    )

    ws.onopen = () => {
      console.log('open')
    }

    ws.onmessage = ({ data }) => {
      let [h, ...t] = data.split`\n`
      let b = t.join`\n`
      switch (h) {
        case 'G':
          msg = deRLE(b, opts.size).map(x => x.map(y => '·#'[y]).join` `)
            .join`\n`
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

<pre>{msg}</pre>
