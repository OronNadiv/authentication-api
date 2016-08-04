const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const warn = log.warn.bind(log, LOG_PREFIX)

const {Router} = require('express')
const _ = require('underscore')
const config = require('../config')
const Login = require('../db/models/login')
const Promise = require('bluebird')
const User = require('../db/models/user')

const INVALID_EMAIL_OR_PASSWORD = 'INVALID_EMAIL_OR_PASSWORD'
const INACTIVE_USER = 'INACTIVE_USER'
const TOO_MANY_LOGIN_ATTEMPTS = 'TOO_MANY_LOGIN_ATTEMPTS'

const authenticated = new Router()
const unauthenticated = new Router()

authenticated.patch('/:id', (req, res, next) => {
  const options = {by: req.client}
  if (!options.by.is_admin && !options.by.is_owner) {
    return res.sendStatus(403)
  }
  User.forge()
    .query({
      where: {
        login_id: req.params.id,
        group_id: options.by.group_id
      }
    })
    .fetch({withRelated: ['login']})
    .then(function (user) {
      if (!user) {
        return res.sendStatus(404)
      }
      const login = user.related('login')
      return login.save({password: req.body.password, failed_login_attempts: 0})
        .then(res.sendStatus.bind(res, 204))
    })
    .catch(next)
})

unauthenticated.get('/', (req, res) => {
  res.render('login')
})

unauthenticated.post('/', (req, res, next) => {
  Promise
    .try(() => {
      return new Login().query(qb => {
        qb.where('email', '=', req.body.email)
      }).fetch({withRelated: ['users.group']})
    })
    .then(login => {
      return Promise
        .try(() => {
          if (!login || !login.related('users') || !login.related('users').models || !login.related('users').models.length) {
            warn(
              'Login failed: User does not exist.  email:',
              req.body.email,
              'headers: ',
              req.headers
            )
            throw new Error(INVALID_EMAIL_OR_PASSWORD)
          }
          if (login.get('failed_login_attempts') > config.maxFailedLoginAttempts) {
            warn(
              'Login failed: Too many login attempts.  email:',
              req.body.email,
              'headers: ',
              req.headers
            )
            throw new Error(TOO_MANY_LOGIN_ATTEMPTS)
          }
          if (!login.isPasswordValid(req.body.password)) {
            warn(
              'Login failed: User used incorrect password.  email:',
              req.body.email,
              'password:',
              req.body.password,
              'headers: ',
              req.headers
            )
            throw new Error(INVALID_EMAIL_OR_PASSWORD)
          }

          let users = _.chain(login.related('users').models)
            .filter(user => user.get('is_active'))
            .sortBy('name')
            .value()
          if (!users.length) {
            warn(
              'Login failed: User is inactive.  email:',
              req.body.email,
              'headers:',
              req.headers
            )
            throw new Error(INACTIVE_USER)
          }

          login.recordSuccessfulAttempt()

          if (users.length > 1) {
            req.session.loginId = login.id
            users = users.map(user => user.toJSON())
            return res.render('groups', {users: users})
          }

          const user = users[0]
          const token = user.generateToken()
          res.cookie('XSRF-TOKEN', token, {
            httpOnly: false, // The cookie is being used by the javascript code.
            secure: config.production,
            domain: config.apiTokenCookieDomain,
            maxAge: user.get('token_expires_in_minutes') * 60 * 1000
          })
          res.redirect(config.uiUrl)
        })
        .catch(err => {
          if (login) {
            login.recordFailedAttempt()
          }
          let msg
          switch (err.message) {
            case INVALID_EMAIL_OR_PASSWORD:
              msg = 'Incorrect email or password'
              break
            case INACTIVE_USER:
              msg = 'Access has been disabled'
              break
            case TOO_MANY_LOGIN_ATTEMPTS:
              msg = 'Too many login attempts'
              break
            default:
              return next(err)
          }

          res.render('login', {
            email: req.body.email,
            error: msg,
            password: req.body.password
          })
        })
    })
    .catch(next)
})

module.exports = {
  authenticated,
  unauthenticated
}
