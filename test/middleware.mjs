/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'

import * as middleware from '../src/middleware'

const { expect } = chai

describe('middleware', () => {
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
    expect(ctx.response).to.equal('text response')
  })

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
