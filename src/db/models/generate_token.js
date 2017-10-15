const verbose = require('debug')('ha:db:models:generate-token:verbose')

const config = require('../../config')
const jwt = require('jsonwebtoken')
const {grant} = require('home-automation-pubnub').Authority
const uuid = 'authentication-api'
const serverKeyRegExp = /^urn:home-automation\/.+$/gi

module.exports = function (audience) { // keep it as function since we use 'this'.
  verbose('generateToken was called.  audience:', audience)
  const tokenExpiresInMinutes = this.get('token_expires_in_minutes')
  const expiresIn = tokenExpiresInMinutes * 60
  verbose('newly generated token will expire in:', expiresIn, 'seconds.')

  const token = jwt.sign(this.toJSON() || {},
    config.authPrivateKey,
    {
      algorithm: 'RS256',
      issuer: 'urn:home-automation/login',
      audience: audience || 'urn:home-automation/*',
      subject: this.id.toString(),
      expiresIn
    }
  )

  const groupId = this.get('group_id')
  // if it's a machine and it's key matches "serverKeyRegExp", then it's a server and therefore it's trusted.
  const isTrusted = !!this.get('is_trusted') || serverKeyRegExp.test(this.get('key'))
  verbose('calling grant.', 'isTrusted:', isTrusted, 'User/machine:', this.toJSON())
  return grant({
    token,
    tokenExpiresInMinutes,
    groupId,
    isTrusted,
    uuid
  }).return(token)
}
