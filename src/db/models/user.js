const Bookshelf = require('../bookshelf')
const generateToken = require('./generate_token')
const group = require('./group')
const login = require('./login')
require('../../config')

module.exports = Bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  generateToken: generateToken,

  group () {
    return this.belongsTo(group)
  },
  login () {
    return this.belongsTo(login)
  }
})
