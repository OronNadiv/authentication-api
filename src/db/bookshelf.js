const verbose = require('debug')('ha:db:bookshelf:verbose')

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
