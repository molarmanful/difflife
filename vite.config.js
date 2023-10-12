import { sveltekit } from '@sveltejs/kit/vite'
import unocss from 'unocss/vite'

import { globWS, globWSUp } from './src/lib/server'

let sv = server => {
  globWS()
  server.httpServer?.on('upgrade', globWSUp)
}

export default {
  plugins: [
    unocss(),
    sveltekit(),
    {
      name: 'ws',
      configureServer: sv,
      configurePreviewServer: sv,
    },
  ],
}
