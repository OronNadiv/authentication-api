const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const error = log.error.bind(log, LOG_PREFIX)

const diehard = require('diehard')
const Promise = require('bluebird')
const expressInitializer = require('./initializations/express')
const domain = require('domain')

const d = domain.create()

d.on('error', error)

d.run(() => {
  log.level = process.env.LOG_LEVEL || 'info'

  Promise
    .try(expressInitializer.initialize)
    .get('server')
    .then(() => diehard.listen({timeout: 5000}))
})
