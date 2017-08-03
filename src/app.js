const diehard = require('diehard')
const Promise = require('bluebird')
const expressInitializer = require('./initializations/express')

Promise
  .try(expressInitializer.initialize)
  .then(() => diehard.listen({timeout: 5000}))
