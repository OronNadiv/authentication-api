const error = require('debug')('ha:config:error')

const fs = require('fs')
const knexPgCustomSchema = require('knex-pg-customschema')
const path = require('path')

const config = {production: process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() === 'PRODUCTION'}

config.apiTokenCookieDomain = process.env.COOKIES_APITOKEN_DOMAIN

config.authPrivateKey = process.env.AUTH_PRIVATE_KEY || (config.production ? null : fs.readFileSync(path.join(__dirname, '../test/keys/private_key.pem')))
if (!config.authPrivateKey) {
  error(
    'Login private key could not be found in the environment variable.  Please set \'AUTH_PRIVATE_KEY\'.'
  )
  process.exit(1)
}

config.authPublicKey = process.env.AUTH_PUBLIC_KEY || (config.production ? null : fs.readFileSync(path.join(__dirname, '../test/keys/public_key.pem')))
if (!config.authPublicKey) {
  error(
    'Login public key could not be found in the environment variable.  Please set \'AUTH_PUBLIC_KEY\'.'
  )
  process.exit(1)
}

config.maxFailedLoginAttempts = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 10, 10)

config.port = process.env.PORT || 3001

config.postgres = process.env.DATABASE_URL || 'postgres://postgres:@localhost/home_automation'
config.postgresPool = {
  min: parseInt(process.env.POSTGRESPOOLMIN || 2, 10),
  max: parseInt(process.env.POSTGRESPOOLMAX || 10, 10),
  log: process.env.POSTGRESPOOLLOG === 'true',
  afterCreate: knexPgCustomSchema('public')
}

config.sessionSecret = process.env.SESSION_SECRET || (config.production ? null : 'This is session secret')
if (!config.sessionSecret) {
  error(
    'Session secret could not be found in the environment variable.  Please set \'SESSION_SECRET\'.'
  )
  process.exit(1)
}

config.skipSSL = process.env.SKIP_SSL && process.env.SKIP_SSL.toUpperCase() === 'TRUE'

config.uiUrl = process.env.UI_URL || 'http://localhost:3000'

module.exports = config
