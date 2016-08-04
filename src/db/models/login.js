const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../../logger')
const info = log.info.bind(log, LOG_PREFIX)

const bcrypt = require('bcrypt')
const Bookshelf = require('../bookshelf')

module.exports = Bookshelf.Model.extend({
  tableName: 'logins',
  hasTimestamps: true,
  hidden: ['password_hash', 'failed_login_attempts', 'email'],

  format (attrs) {
    if (attrs.password) {
      attrs.password_hash = bcrypt.hashSync(attrs.password, 5)
      delete attrs.password
    }
    if (attrs.email) {
      attrs.email = attrs.email.trim()
    }

    return attrs
  },

  users () {
    return this.hasMany(require('./user'))
  },

  isPasswordValid (password) {
    return bcrypt.compareSync(password, this.get('password_hash'))
  },

  recordSuccessfulAttempt () {
    info(`Successful login.  email: ${this.get('email')}`)
    return this.save({failed_login_attempts: 0})
  },

  recordFailedAttempt () {
    return this.save({failed_login_attempts: this.get('failed_login_attempts') + 1})
  }
})
