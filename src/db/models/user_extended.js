const bookshelf = require('../bookshelf')
const generateToken = require('./generate_token')
const group = require('./group')
require('../../config')

module.exports = bookshelf.Model.extend({
  tableName: 'users_extended',
  hasTimestamps: true,
  generateToken: generateToken,

  group () {
    return this.belongsTo(group)
  }
})
