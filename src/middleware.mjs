import config from 'config'
import path from 'path'

import logger from './logger'
import { GET_SCALED_IMAGE } from './route-names'

/**
 * Simple helper middleware thet sets response body to the value that is returned from the provided function.
 * Additionally sets proper status code (204 if the return value is undefined, 200 otherwise)
 *
 * @param fn
 * @returns {Function}
 */
export const useReturnValue = (fn) => async (ctx, next) => {
  const response = await fn(ctx)

  if (typeof response !== 'undefined') {
    ctx.status = 200
    ctx.body = response
  } else {
    ctx.status = 204
  }

  return next()
}

export const returnErrorResponse = (e, ctx) => {
  logger.error(e.message)
  logger.debug(e.stack)

  ctx.body = e.message
  ctx.status = e.status || 500
}

export const errorHandler = (handle = returnErrorResponse) => async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    handle(e, ctx)
  }
}

// taken from @tailored-apps/koa-middleware for convenience
export const requestProfiler = () => async (ctx, next) => {
  logger.debug(`${ctx.method} ${ctx.url} starting`)

  const requestStart = new Date()

  await next()

  const elapsed = ((new Date() - requestStart) / 1000).toFixed(4)

  if (ctx.status >= 400) {
    logger.warn(`${ctx.method} ${ctx.url} finished with ${ctx.status} error, took ${elapsed} sec.`)
  } else {
    logger.info(`${ctx.method} ${ctx.url} finished successfully, took ${elapsed} sec.`)
  }
}

export const imageUploader = (baseUrl = config.get('baseUrl')) => async ({ router, request: { files } }) => {
  const filename = path.basename(files[0].path)
  const id = path.basename(filename, path.extname(filename))
  const uri = `${baseUrl}${router.url(GET_SCALED_IMAGE, { id })}`

  return {
    uri
  }
}

export const imageScaler = () => () => {

}
