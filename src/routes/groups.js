const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const warn = log.warn.bind(log, LOG_PREFIX)

const {Router} = require('express')
const config = require('../config')
const Login = require('../db/models/login')

const router = new Router()

router.get('/', (req, res) => {
  if (!req.session || !req.session.loginId) {
    warn('Login failed: Login ID could not be found in the session.')
    return res.redirect('/')
  }
  const loginId = req.session.loginId
  const userId = req.query.user_id

  Login.forge().query(qb => {
    qb.where('id', '=', loginId)
  })
    .fetch({
      withRelated: {
        'users': qb => {
          qb.where('is_active', '=', true)
          qb.where('id', '=', userId)
        }
      }
    })
    .then(login => {
      if (!login) {
        warn(
          'Login failed: Login could not be found.  loginId:',
          loginId,
          'userId:',
          userId
        )
        return res.redirect('/')
      }
      if (!login.related('users').length) {
        warn(
          'Login failed: User could not be found.  loginId:',
          loginId,
          'userId:',
          userId
        )
        return res.redirect('/')
      }
      const user = login.related('users').at(0)
      const token = user.generateToken()
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // The cookie is being used by the javascript code.
        secure: config.production,
        domain: config.apiTokenCookieDomain,
        maxAge: user.get('token_expires_in_minutes') * 60 * 1000
      })
      res.redirect(config.uiUrl)
    })
})

module.exports = router
