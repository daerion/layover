import config from 'config'
import createError from 'http-errors'
import mimeTypes from 'mime-types'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import util from 'util'

import logger from './logger'
import { GET_SCALED_IMAGE } from './route-names'
import { createScaledImage } from './helpers'

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

export const imageUploader = (baseUrl = config.get('baseUrl')) => async (ctx, next) => {
  const { router, request: { files } } = ctx

  const filename = path.basename(files[0].path)
  const uri = `${baseUrl}${router.url(GET_SCALED_IMAGE, { filename })}`

  ctx.redirect(uri)

  return next()
}

export const imageScaler = (dependencies = { }) => {
  const {
    baseUrl = config.get('baseUrl'),
    stat = util.promisify(fs.stat),
    directories = config.get('directories'),
    createFile = createScaledImage,
    createStream = fs.createReadStream
  } = dependencies

  return async (ctx, next) => {
    const { router, params: { filename } } = ctx

    const input = `${directories.originals}/${filename}`
    const output = `${directories.edited}/${filename}`

    try {
      logger.verbose('Checking for input file %s.', input)

      await stat(input)

      logger.debug('Input file %s exists.', input)
    } catch (e) {
      if (e.code === 'ENOENT') {
        logger.warn('Input file %s does not exist.', input)

        throw createError(404)
      }

      throw e
    }

    try {
      logger.verbose('Checking for scaled output file %s.', output)

      await stat(output)

      logger.debug('Scaled output file %s exists.', output)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e
      }

      logger.verbose('Scaled output file %s does not exist - creating.', output)

      await createFile(input, output)
    }

    logger.debug('Creating read stream for scaled output file %s.', output)

    ctx.set('X-Image-Url', `${baseUrl}${router.url(GET_SCALED_IMAGE, { filename })}`)
    ctx.set('Content-Type', mimeTypes.contentType(filename))
    ctx.body = createStream(output)

    return next()
  }
}
