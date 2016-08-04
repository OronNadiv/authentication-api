const Model = require('../../src/db/models/group')

module.exports = factory => {
  factory.define('group', Model, {
    name: factory.chance.name(),
    emails: [factory.chance.email()],
    phones: [factory.chance.phone()]
  })
}
