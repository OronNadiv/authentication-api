/* How to generate public/private keys using openssl:
 1. openssl genrsa -out private_key.pem 2048
 2. openssl rsa -in private_key.pem -pubout -out public_key.pem

 The public key should be stored in the DB table public.machines.
 The private key should be stored on the target machine.
 */

const bookshelf = require('../bookshelf')
const generateToken = require('./generate_token')
require('../../config')

module.exports = bookshelf.Model.extend({
  tableName: 'machines',
  hasTimestamps: true,
  generateToken: generateToken,
  initialize () {
    this.on('updating', (model, attrs, options) => {
      return model.deepChanged('group_id', options)
        .spread(haschanged => {
          if (haschanged) {
            throw new Error('Group id cannot be modified.')
          }
        })
    })
  }
})
