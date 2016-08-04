module.exports = {
  up: knex => {
    return knex.transaction(trx => {
      return trx.schema.table('machines', table => {
        table.integer('group_id')
          .references('id')
          .inTable('groups')
          .onDelete('CASCADE')
          .onUpdate('CASCADE')
      })
        .then(() => {
          return trx.schema.table('users', table => {
            table.integer('token_expires_in_minutes').notNullable().defaultTo(5)
          })
        })
    })
  },
  down: knex => {
    return knex.transaction(trx => {
      return trx.schema.table('machines', table => {
        table.dropColumn('group_id')
      })
        .then(() => {
          return trx.schema.table('users', table => {
            table.dropColumn('token_expires_in_minutes')
          })
        })
    })
  }
}
