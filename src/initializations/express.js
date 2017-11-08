const verbose = require('debug')('ha:initializations:express:verbose')
const info = require('debug')('ha:initializations:express:info')
const warn = require('debug')('ha:initializations:express:warn')
const error = require('debug')('ha:initializations:express:error')

const {authenticated, unauthenticated} = require('./../routes/login')
const authToken = require('./../middleware/auth_token')
const bodyParser = require('body-parser')
const config = require('./../config')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const cors = require('cors')
const diehard = require('diehard')
const express = require('express')
const favicon = require('serve-favicon')
const groups = require('./../routes/groups')
const machines = require('./../middleware/machines')
const path = require('path')
const ping = require('./../middleware/ping')
const Promise = require('bluebird')
const redirectToHttps = require('./../middleware/redirect_to_https')
const stylus = require('stylus')
const tokens = require('./../routes/tokens')
const users = require('./../routes/users')
const xHeaders = require('./../middleware/x_headers')

const app = express()

module.exports = {
  initialize () {
    return new Promise(resolve => {
      app.set('views', path.join(__dirname, '../../views'))
      app.set('view engine', 'pug')

      app.use(redirectToHttps)
      app.use(xHeaders)
      app.use(bodyParser.json())
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(favicon(path.join(__dirname, '../../public/favicon.ico')))
      app.use(stylus.middleware(path.join(__dirname, '../../public')))
      app.use(express.static(path.join(__dirname, '../../public')))

      app.use('/ping', ping)
      app.use(cookieSession({
        secret: config.sessionSecret,
        secureProxy: config.production,
        maxage: 1000 * 60 * 60
      }))
      app.use(unauthenticated)
      app.use('/groups', groups)
      app.use(machines)
      app.use('/tokens', tokens)

      app.use(cookieParser())
      app.use(cors({
        origin: config.uiUrl,
        credentials: true,
        maxAge: 10 * 60
      }))
      app.use(authToken)
      app.use(authenticated)
      app.use('/users', users)

      app.use((err, req, res) => {
        if (!(err instanceof Error)) {
          // req is actually res.
          warn('unknown request.  See logs for more details.')
          return req.sendStatus(404)
        }
        error('sending Error.  Err: ', err)
        return res.sendStatus(err.status || 500)
      })

      const server = app.listen(config.port, () => {
        info(`Express server listening on port ${server.address().port}`)

        diehard.register(done => {
          verbose('Shutting down http server')
          server.close(() => {
            verbose('Http server was shutdown successfully.')
            done()
          })
        })

        resolve({server: server, express: app})
      })
    })
  }
}
