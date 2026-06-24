'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Kreira potpisani JWT token za korisnika.
 * @param {{id:number, role:string, aai_uid:string}} user
 */
function signToken(user) {
  const payload = { sub: user.id, role: user.role, uid: user.aai_uid };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

/**
 * Verificira i dekodira JWT token. Baca grešku ako je nevažeći/istekao.
 */
function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signToken, verifyToken };
