import config from 'config'
import winston from 'winston'

const { createLogger, format, transports } = winston

/**
 * @property {Function} debug
 * @property {Function} verbose
 * @property {Function} info
 * @property {Function} warn
 * @property {Function} error
 * @type {Object}
 */
export default createLogger({
  level: config.get('logLevel'),
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.printf((info) => `[${info.timestamp}] [${info.level}] ${info.message}`)
  ),
  transports: [ new transports.Console() ]
})
