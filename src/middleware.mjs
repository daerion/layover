import logger from './logger'

/**
 * Simple helper middleware thet sets response body to the provided functions return value.
 * Additionally sets proper status code (204 if the return value is undefined, 200 otherwise)
 *
 * @param fn
 * @returns {Function}
 */
export const useReturnValue = (fn) => async (ctx, next) => {
  const response = await fn(ctx)

  if (typeof response !== 'undefined') {
    ctx.status = 200
    ctx.response = response
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

export const uploadImage = () => {

}

export const getScaledImage = () => {

}
