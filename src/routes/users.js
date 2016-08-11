const verbose = require('debug')('ha:routes:users:verbose')

const {Router} = require('express')
const _ = require('underscore')
const Login = require('../db/models/login')
const User = require('../db/models/user')
const UserExtended = require('../db/models/user_extended')

const router = new Router()

module.exports = router

router.post('/', (req, res, next) => {
  const options = {by: req.client}
  if (!options.by.is_admin) {
    return res.sendStatus(403)
  }
  Login.forge()
    .save({
      email: req.body.email,
      password: req.body.password
    }, options)
    .then(function (login) {
      verbose('login:', login.toJSON())
      return User.forge().save({
        name: req.body.name,
        is_active: true,
        login_id: login.id,
        group_id: req.client.group_id
      })
    })
    .then(function (user) {
      return UserExtended.forge()
        .query({where: {id: user.id}})
        .fetch()
        .call('toJSON')
        .then(res.json.bind(res))
    })
    .catch(next)
})

router.get('/me', (req, res) => {
  res.json(req.client)
})

router.get('/', (req, res, next) => {
  const options = {by: req.client}
  if (!options.by.is_admin) {
    return res.sendStatus(403)
  }
  UserExtended.forge()
    .query(function (qb) {
      qb.where('group_id', '=', options.by.group_id)
      qb.orderBy('name')
    })
    .fetchAll(options)
    .call('toJSON')
    .then(res.json.bind(res))
    .catch(next)
})

router.get('/:id', (req, res, next) => {
  const options = {by: req.client}
  if (!options.by.is_admin) {
    return res.sendStatus(403)
  }
  UserExtended.forge()
    .query(function (qb) {
      qb.where('group_id', '=', options.by.group_id)
      qb.where('id', '=', req.params.id)
    })
    .fetch(options)
    .then(function (user) {
      if (!user) {
        return res.sendStatus(404)
      }
      return user.toJSON()
    })
    .then(res.json.bind(res))
    .catch(next)
})

router.patch('/:id', (req, res, next) => {
  const options = {by: req.client}
  if (!options.by.is_admin) {
    return res.sendStatus(403)
  }
  User.forge()
    .query(function (qb) {
      qb.where('id', '=', req.params.id)
      qb.where('group_id', '=', options.by.group_id)
    })
    .fetch(options)
    .then(function (user) {
      if (!user) {
        return res.sendStatus(404)
      }

      req.body.is_admin = req.body.role === 'admin'
      req.body.is_trusted = req.body.role === 'admin' || req.body.role === 'trusted'

      return user.save(_.pick(req.body, 'is_active', 'is_trusted', 'is_admin', 'name'), options)
        .then(function (user) {
          return UserExtended.forge()
            .query({where: {id: user.id}})
            .fetch()
            .call('toJSON')
            .then(res.json.bind(res))
        })
    })
    .catch(next)
})
