
const config = require('config')
const knex = require('knex')

const c = config.get("postgress")

const db = knex({
  client: 'pg',
  connection: {
    host: c.host,
    user: c.user,
    port: c.port,
    password: c.password,
    database: c.database,
  },
})

exports.db = db
