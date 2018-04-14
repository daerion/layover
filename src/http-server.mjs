import bodyParser from 'koa-bodyparser'
import config from 'config'
import Koa from 'koa'

import createRouter from './router'
import logger from './logger'
import { errorHandler, requestProfiler } from './middleware'

const defaults = {
  port: config.get('port'),
  router: createRouter()
}

export const server = ({ port, router } = defaults) => {
  logger.info('Starting HTTP server, listening on port %s.', port)

  const koa = new Koa()

  koa
    .use(requestProfiler())
    .use(errorHandler())
    .use(bodyParser())
    .use(router.allowedMethods())
    .use(router.routes())

  return koa.listen(port)
}
