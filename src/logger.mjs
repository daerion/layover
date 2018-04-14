import config from 'config'
import winston from 'winston'

const { format } = winston
const level = config.get('logLevel')
const loggingDisabled = level.toLowerCase() === 'none'

const stdout = new winston.transports.Console({
  silent: loggingDisabled,
  stderrLevels: [ 'error' ]
})
/**
 * @property {Function} debug
 * @property {Function} verbose
 * @property {Function} info
 * @property {Function} warn
 * @property {Function} error
 * @type {Object}
 */
export default winston.createLogger({
  level,
  transports: [ stdout ],
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.printf((info) => `[${info.timestamp}] [${info.level}] ${info.message}`)
  )
})
