/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'

import * as middleware from '../src/middleware'
import { GET_SCALED_IMAGE } from '../src/route-names'

const { expect } = chai

describe('middleware', () => {
  describe('response helper', () => {
    it('passes ctx to the provided function', async () => {
      const ctx = { }
      const fn = sinon.spy()

      const run = middleware.useReturnValue(fn)

      await run(ctx, sinon.spy())

      sinon.assert.calledWith(fn, ctx)
    })

    it('sets status 204 for undefined return values', async () => {
      const ctx = { }
      const fn = sinon.stub().resolves(undefined)
      const runMiddleware = middleware.useReturnValue(fn)

      await runMiddleware(ctx, sinon.spy())

      expect(ctx.status).to.equal(204)
    })

    it('sets status code and response body', async () => {
      const ctx = { }
      const fn = sinon.stub().resolves('text response')
      const runMiddleware = middleware.useReturnValue(fn)

      await runMiddleware(ctx, sinon.spy())

      expect(ctx.status).to.equal(200)
      expect(ctx.body).to.equal('text response')
    })
  })

  describe('error handler', () => {
    it('sets status code and response body', () => {
      const ctx = { }
      const err = new Error('custom message')
      err.status = 401

      middleware.returnErrorResponse(err, ctx)

      expect(ctx.status).to.equal(401)
      expect(ctx.body).to.equal('custom message')
    })

    it('calls an error handler', async () => {
      const err = new Error('mock error')
      const ctx = { }
      const next = sinon.stub().rejects(err)
      const handle = sinon.spy()

      const handleError = middleware.errorHandler(handle)

      await handleError(ctx, next)

      sinon.assert.callCount(next, 1)
      sinon.assert.calledWith(handle, err, ctx)
    })
  })

  describe('image uploader', () => {
    it('redirects to uri for scaled image after upload', async () => {
      const ctx = {
        redirect: sinon.spy(),
        request: { files: [ { path: '/foo/bar/baz.png' } ] },
        router: {
          url: sinon.stub().returns('/some/route')
        }
      }
      const baseUrl = 'http://base.url'

      const handleUpload = middleware.imageUploader(baseUrl)

      await handleUpload(ctx, sinon.spy())

      sinon.assert.calledWith(ctx.router.url, GET_SCALED_IMAGE, { id: 'baz' })
      sinon.assert.calledWith(ctx.redirect, 'http://base.url/some/route')
    })
  })
})
