const verbose = require('debug')('ha:db:models:generate-token:verbose')

const config = require('../../config')
const jwt = require('jsonwebtoken')
const {grant} = require('home-automation-pubnub').Authority

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
  const isTrusted = !!this.get('is_trusted')
  return grant({token, tokenExpiresInMinutes, groupId, isTrusted})
    .return(token)
}
