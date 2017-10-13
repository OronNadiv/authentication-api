const verbose = require('debug')('ha:routes:groups:verbose')

const Promise = require('bluebird')
const {Router} = require('express')

const router = new Router()

module.exports = router

router.post('/', (req, res, next) => {
  verbose('/tokens called.')
  if (!req.machine) {
    return res.sendStatus(401)
  }
  Promise
    .try(() => req.machine.generateToken(req.audience))
    .then(token => res.json({token: token}))
    .catch(next)
})
