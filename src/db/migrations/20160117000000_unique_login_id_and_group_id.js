module.exports = {
  up: knex => {
    return knex.transaction(trx => {
      return trx.schema.table('users', table => {
        table.unique(['login_id', 'group_id'])
      })
    })
  },
  down: knex => {
    return knex.transaction(trx => {
      return trx.schema.table('users', table => {
        table.dropUnique(['login_id', 'group_id'])
      })
    })
  }
}
