const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)

const Promise = require('bluebird')
const {Router} = require('express')

const router = new Router()

module.exports = router

router.post('/', (req, res, next) => {
  verbose('/tokens called.')
  if (!req.machine) {
    return res.sendStatus(401)
  }
  Promise.resolve()
    .then(() => req.machine.generateToken(req.audience))
    .then(token => res.json({token: token}))
    .catch(next)
})
