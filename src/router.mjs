import busboy from 'koa-busboy'
import config from 'config'
import path from 'path'
import Router from 'koa-router'
import uuid from 'uuid'

import { imageScaler, imageUploader, useReturnValue } from './middleware'
import { GET_SCALED_IMAGE, STATUS, UPLOAD_IMAGE } from './route-names'

export default function createRouter () {
  const router = new Router({
    prefix: '/v1'
  })

  const uploader = busboy({
    dest: config.get('directories.originals'),
    fnDestFilename: (fieldname, filename) => `${uuid.v4()}${path.extname(filename)}`
  })

  router
  // Endpoint that returns "204 No Content" when the API is up and running
    .get(STATUS, '/status', useReturnValue(() => undefined))

    .post(UPLOAD_IMAGE, '/images', uploader, useReturnValue(imageUploader()))
    .get(GET_SCALED_IMAGE, '/images/:filename', imageScaler())

  return router
}
