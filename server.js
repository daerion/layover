// require() main http server module through esn in order to enable ESM import/export syntax
const { server } = require('esm')(module)('./src/http-server.mjs')

server()
