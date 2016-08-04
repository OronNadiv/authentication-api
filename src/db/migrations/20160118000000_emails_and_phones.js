module.exports = {
  up: knex => {
    return knex.transaction(trx => {
      return trx.schema.table('groups', table => {
        table.specificType('emails', 'citext[]')
        table.specificType('phones', 'citext[]')
      })
    })
  },
  down: knex => {
    return knex.transaction(trx => {
      return trx.schema.table('users', table => {
        table.dropColumn('emails')
        table.dropColumn('phones')
      })
    })
  }
}
