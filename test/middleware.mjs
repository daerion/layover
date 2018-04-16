/* eslint-env mocha */

import chai from 'chai'
import chaiHelpers from '@tailored-apps/helpers/chai'
import createError from 'http-errors'
import sinon from 'sinon'

import * as middleware from '../src/middleware'
import { GET_SCALED_IMAGE } from '../src/route-names'

const { expect } = chai
const { expectAsyncError } = chaiHelpers

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
    it('returns url for scaled image after upload', async () => {
      const ctx = {
        request: { files: [ { path: '/foo/bar/baz.png' } ] },
        router: {
          url: sinon.stub().returns('/some/route/baz.png')
        }
      }
      const baseUrl = 'http://base.url'

      const handleUpload = middleware.imageUploader(baseUrl)

      const response = await handleUpload(ctx, sinon.spy())

      sinon.assert.calledWith(ctx.router.url, GET_SCALED_IMAGE, { filename: 'baz.png' })

      expect(response).to.deep.equal({ url: 'http://base.url/some/route/baz.png' })
    })
  })

  describe('image scaler', () => {
    const enoent = () => {
      const err = new Error()
      err.code = 'ENOENT'

      return err
    }

    const ctx = (filename) => ({ params: { filename }, router: { url: sinon.spy() }, set: sinon.spy() })

    it('throws a 404 error if the input filedoes not exist', async () => {
      const stat = sinon.stub().rejects(enoent())
      const runMiddleware = middleware.imageScaler({ stat })

      await expectAsyncError(() => runMiddleware(ctx(), sinon.spy()), (err) => {
        expect(err.status).to.equal(404)
      })
    })

    it('creates the image file if it does not exist', async () => {
      const stat = sinon.stub()
        .onFirstCall().resolves()
        .onSecondCall().rejects(enoent())

      const createFile = sinon.spy()
      const createStream = sinon.spy()

      const runMiddleware = middleware.imageScaler({
        stat,
        createFile,
        createStream,
        directories: {
          originals: 'orig',
          edited: 'edited'
        }
      })

      await runMiddleware(ctx('baz.png'), sinon.spy())

      sinon.assert.calledWith(createFile, 'orig/baz.png', 'edited/baz.png')
      sinon.assert.calledWith(createStream, 'edited/baz.png')
    })
  })
})
