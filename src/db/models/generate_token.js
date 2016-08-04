const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)

const config = require('../../config')
const jwt = require('jsonwebtoken')

module.exports = function (audience) {
  verbose('generateToken was called.  audience:', audience)
  const expiresIn = this.get('token_expires_in_minutes') * 60
  verbose('newly generated token will expire in:', expiresIn, 'seconds.')

  return jwt.sign(this.toJSON() || {},
    config.authPrivateKey,
    {
      algorithm: 'RS256',
      issuer: 'urn:home-automation/login',
      audience: audience || 'urn:home-automation/*',
      subject: this.id.toString(),
      expiresIn: expiresIn
    }
  )
}
