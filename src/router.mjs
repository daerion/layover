import Router from 'koa-router'
import { getScaledImage, uploadImage, useReturnValue } from './middleware'

export default () => {
  const router = new Router({
    prefix: '/v1'
  })

  router
    // Endpoint that returns "204 No Content" when the API is up and running
    .get('/status', useReturnValue(() => undefined))

    .post('/images', useReturnValue(uploadImage))
    .get('/images/:id', useReturnValue(getScaledImage))

  return router
}
