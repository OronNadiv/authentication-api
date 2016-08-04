module.exports = {
  up: knex => {
    return knex.transaction(trx => {
      return Promise
        .resolve(trx.raw('DROP EXTENSION IF EXISTS citext;'))
        .then(trx.raw.bind(trx, 'CREATE EXTENSION citext;'))
        .then(() => {
          return trx.schema.createTable('logins', table => {
            table.increments('id').primary()
            table.specificType('email', 'citext').notNullable().unique()
            table.string('password_hash').notNullable()
            table.integer('failed_login_attempts').defaultTo(0).notNullable()
            table.timestamps()
          })
        })
        .then(() => {
          return trx.schema.createTable('groups', table => {
            table.increments('id').primary()
            table.string('name').notNullable()
          })
        })
        .then(() => {
          return trx.schema.createTable('users', table => {
            table.increments('id').primary()
            table.string('name').notNullable()
            table.boolean('is_active').notNullable()
            table.boolean('is_trusted').notNullable().defaultTo(false)
            table.boolean('is_admin').notNullable().defaultTo(false)
            table.integer('group_id').notNullable()
              .references('id')
              .inTable('groups')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
            table.integer('login_id').notNullable()
              .references('id')
              .inTable('logins')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
            table.timestamps()
          })
        })
        .then(() => {
          return trx.schema.table('groups', table => {
            table.integer('owner_id')
              .references('id')
              .inTable('users')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
          })
        })
        .then(() => {
          return trx.schema.createTable('machines', table => {
            table.increments('id').primary()
            table.string('key').notNullable().unique()
            table.string('name').notNullable()
            table.text('public_key').notNullable().unique()
            table.integer('token_expires_in_minutes').notNullable().defaultTo(5)
            table.timestamps()
          })
        })
    })
  },
  down: knex => {
    return knex.transaction(trx => {
      return Promise
        .resolve(trx.schema.dropTable('machines'))
        .then(() => {
          return trx.schema.table('groups', table => {
            table.dropColumn('owner_id')
          })
        })
        .then(trx.schema.dropTable.bind(trx.schema, 'users'))
        .then(trx.schema.dropTable.bind(trx.schema, 'groups'))
        .then(trx.schema.dropTable.bind(trx.schema, 'logins'))
        .then(trx.raw.bind(trx, 'DROP EXTENSION IF EXISTS citext;'))
    })
  }
}
