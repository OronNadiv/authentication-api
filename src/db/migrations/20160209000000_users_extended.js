module.exports = {
  up: knex => {
    return knex.raw(
      'CREATE VIEW public.users_extended AS' +
      ' SELECT users.id,' +
      '     users.name,' +
      '     users.group_id,' +
      '     logins.email,' +
      '         CASE' +
      '             WHEN groups.owner_id = users.id OR users.is_active THEN true' +
      '             ELSE false' +
      '         END AS is_active,' +
      '         CASE' +
      '             WHEN groups.owner_id = users.id OR users.is_admin OR users.is_trusted THEN true' +
      '             ELSE false' +
      '         END AS is_trusted,' +
      '         CASE' +
      '             WHEN groups.owner_id = users.id OR users.is_admin THEN true' +
      '             ELSE false' +
      '         END AS is_admin,' +
      '         CASE' +
      '             WHEN groups.owner_id = users.id THEN true' +
      '             ELSE false' +
      '         END AS is_owner' +
      '    FROM users' +
      '      JOIN logins ON users.login_id = logins.id' +
      '      JOIN groups ON users.group_id = groups.id;'
    )
  },
  down: knex => {
    return knex.raw('DROP VIEW public.users_extended;')
  }
}
