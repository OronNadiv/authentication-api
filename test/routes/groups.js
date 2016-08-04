const Promise = require('bluebird')
const UserFixture = require('../fixtures/user')
const userFixture = new UserFixture()

let context

describe('Login - Login route tests', () => {
  before(() =>
    Promise
      .resolve(userFixture.create())
      .then((cont) => {
        context = cont
      })
  )

  after(() => userFixture.cleanup())

  it.skip('GET /groups 200', () => {
    return context.request
      .get('/groups')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then(({body}) => {
        console.log('body', body)
      })
  })
})
