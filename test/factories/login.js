const Model = require('../../src/db/models/login')

module.exports = factory => {
  factory.define('login', Model, {
    email: factory.chance.email(),
    password: factory.chance.word()
  })
}
