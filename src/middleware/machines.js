const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const warn = log.warn.bind(log, LOG_PREFIX)

const config = require('../config')
const jwt = require('jsonwebtoken')
const Machine = require('../db/models/machine')

module.exports = (req, res, next) => {
  if (!req.headers.authorization || !/^Bearer .*/.test(req.headers.authorization)) {
    return next()
  }

  const token = req.headers.authorization.match(/^Bearer (.*)$/)[1]
  const payload = jwt.decode(token)

  if (!/urn:home-automation\/.+/.test(payload.aud) ||
    payload.iss === 'urn:home-automation/login') {
    return next()
  }

  function setReqValues (audience, machine) {
    req.machine = machine
    req.audience = audience
  }

  if (!config.production) {
    return setReqValues(payload.aud, {})
  }
  new Machine().query({where: {key: payload.iss}}).fetch()
    .then(machine => {
      if (!machine || !machine.get('public_key')) {
        warn('machine could not be found.  iss:', payload.iss)
        return res.sendStatus(401)
      }

      jwt.verify(token, machine.get('public_key'), err => {
        if (err) {
          return next(err)
        }

        verbose(
          'incoming machine request.',
          'machine.token_expires_in_minutes:',
          machine.get('token_expires_in_minutes'),
          'payload:',
          payload
        )

        if (!machine.get('group_id')) {
          // some machines such as alarm and garage servers can fire requests on behalf of a specific group.
          machine.set('group_id', payload.group_id)
        }

        setReqValues(payload.aud, machine)

        next()
      })
    })
    .catch(next)
}
