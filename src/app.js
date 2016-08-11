const error = require('debug')('ha:app:error')

const diehard = require('diehard')
const Promise = require('bluebird')
const expressInitializer = require('./initializations/express')
const domain = require('domain')

const d = domain.create()

d.on('error', error)

d.run(() => {
  Promise
    .try(expressInitializer.initialize)
    .get('server')
    .then(() => diehard.listen({timeout: 5000}))
})
