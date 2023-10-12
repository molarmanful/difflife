import { server } from './build/index.js'
import { globWS, globWSUp } from './src/lib/server/index.js'

globWS()
server.server.on('upgrade', globWSUp)
