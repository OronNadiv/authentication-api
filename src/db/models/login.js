const info = require('debug')('ha:db:models:login:info')

const _ = require('underscore')
const bcrypt = require('bcrypt')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const makeError = require('make-error')
const Promise = require('bluebird')

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

  validateLoginAttempts () {
    const self = this
    return this.get('failed_login_attempts') <= config.maxFailedLoginAttempts
      ? Promise.resolve()
      : Promise.reject(new module.exports.TooManyLoginAttemptsError(self))
  },

  validatePassword (password) {
    const self = this
    return bcrypt.compareSync(password, this.get('password_hash'))
      ? Promise.resolve()
      : Promise.reject(new module.exports.InvalidPasswordError(self))
  },

  getActiveUsers () {
    const self = this
    if (self.related('users') && self.related('users').length) {
      let users = _.chain(self.related('users').models)
        .filter(user => user.get('is_active'))
        .sortBy('name')
        .value()
      return Promise.resolve(users)
    } else {
      return Promise.reject(new module.exports.NoActiveUsersFoundError(self))
    }
  },

  recordSuccessfulAttempt () {
    info(`Successful login.  email: ${this.get('email')}`)
    return this.save({failed_login_attempts: 0})
  },

  recordFailedAttempt () {
    return this.save({failed_login_attempts: this.get('failed_login_attempts') + 1})
  }
}, {
  TooManyLoginAttemptsError: makeError('TooManyLoginAttemptsError'),
  InvalidPasswordError: makeError('InvalidPasswordError'),
  NoActiveUsersFoundError: makeError('NoActiveUsersFoundError')
})
