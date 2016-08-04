const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)

const bookshelf = require('bookshelf')
const deepChangedPlugin = require('bookshelf-deep-changed-plugin')
const diehard = require('diehard')
const knex = require('knex')
const knexConfiguration = require('./knex')

const repository = bookshelf(knex(knexConfiguration))

repository.plugin('visibility')
repository.plugin(deepChangedPlugin)

diehard.register(done => {
  verbose('Shutting down postgres connection.')
  repository.knex.destroy(() => {
    verbose('Postgres connection shutdown successfully.')
    done()
  })
})

module.exports = repository
