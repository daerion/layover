import config from 'config'

import logger from './logger'

const defaults = {
  port: config.get('port')
}

export const server = (port = defaults.port) => {
  logger.info('Starting HTTP server, listening on port %s.', port)
}
