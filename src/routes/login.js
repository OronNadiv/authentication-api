const warn = require('debug')('ha:routes:login:warn')
const error = require('debug')('ha:routes:login:error')

const {Router} = require('express')
const config = require('../config')
const Login = require('../db/models/login')
const Promise = require('bluebird')
const User = require('../db/models/user')

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
      return new Login()
        .query(qb => {
          qb.where({email: req.body.email})
        })
        .fetch({
          withRelated: ['users.group'],
          require: true
        })
    })
    .tap((login) => {
      return login.validateLoginAttempts()
    })
    .tap((login) => {
      return login.validatePassword(req.body.password)
    })
    .then((login) => {
      return Promise.props({
        login,
        users: login.getActiveUsers()
      })
    })
    .then(({login, users}) => {
      login.recordSuccessfulAttempt()

      if (users.length > 1) {
        req.session.loginId = login.id
        users = users.map(user => user.toJSON())
        return res.render('groups', {users: users})
      }

      const user = users[0]
      return Promise.props({token: user.generateToken(), user})
    })
    .then(({token, user}) => {
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // The cookie is being used by the javascript code.
        secure: config.production,
        domain: config.apiTokenCookieDomain,
        maxAge: user.get('token_expires_in_minutes') * 60 * 1000
      })
      res.redirect(config.uiUrl)
    })
    .catch(Login.NotFoundError, () => {
      warn(
        'Login failed: User does not exist.  email:',
        req.body.email,
        'headers: ',
        req.headers
      )
      res.render('login', {
        email: req.body.email,
        error: 'Incorrect email or password',
        password: req.body.password
      })
    })
    .catch(Login.TooManyLoginAttemptsError, () => {
      warn(
        'Login failed: Too many login attempts.  email:',
        req.body.email,
        'headers: ',
        req.headers
      )
      res.render('login', {
        email: req.body.email,
        error: 'Too many login attempts',
        password: req.body.password
      })
    })
    .catch(Login.InvalidPasswordError, (err) => {
      warn(
        'Login failed: User used incorrect password.  email:',
        req.body.email,
        'password:',
        req.body.password,
        'headers: ',
        req.headers
      )
      res.render('login', {
        email: req.body.email,
        error: 'Incorrect email or password',
        password: req.body.password
      })
      return err.message.recordFailedAttempt()
    })
    .catch(Login.NoActiveUsersFoundError, () => {
      warn(
        'Login failed: User is inactive.  email:',
        req.body.email,
        'headers:',
        req.headers
      )
      res.render('login', {
        email: req.body.email,
        error: 'Access has been disabled',
        password: req.body.password
      })
    })
    .catch(next)
})

module.exports = {
  authenticated,
  unauthenticated
}
