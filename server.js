// require() main http server module through esm in order to enable ESM import/export syntax
const { default: startServer } = require('esm')(module)('./src/http-server.mjs')

startServer()
