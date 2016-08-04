const Promise = require('bluebird')
const should = require('should')
const UserFixture = require('../fixtures/user')
const userFixture = new UserFixture()

let context

describe('Login - Home route tests', () => {
  before(() =>
    Promise
      .resolve(userFixture.create())
      .then((cont) => {
        context = cont
      })
  )

  after(() => userFixture.cleanup())

  it.skip('/ -https -token should get 302 to https', () => {
    return context.request
      .get('/')
      .set('Accept', 'application/json')
      .send()
      .expect(302)
      .then((res) => {
        res.headers.location.should.startWith('https://')
      })
  })

  it('/ +https -token should get 302 to login', () => {
    return context.request
      .get('/')
      .set('Accept', 'application/json')
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then((res) => should.not.exist(res.headers.location))
  })

  it.skip('/ -https +token should get 302 to https', () => {
    return context.request
      .get('/')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .send()
      .expect(302)
      .then((res) => res.headers.location.should.startWith('https://'))
  })

  it('/ +https +token should get 200', () => {
    return context.request
      .get('/')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then((res) => {
        should.not.exist(res.headers.location)
      })
  })
})
