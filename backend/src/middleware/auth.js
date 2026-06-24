'use strict';

const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const userModel = require('../models/userModel');

/**
 * Middleware: zahtijeva važeći JWT u `Authorization: Bearer <token>` zaglavlju.
 * Dohvaća svježeg korisnika iz baze i postavlja `req.user`.
 */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Nedostaje pristupni token');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (_e) {
      throw ApiError.unauthorized('Nevažeći ili istekli token');
    }

    const user = await userModel.findById(decoded.sub);
    if (!user) throw ApiError.unauthorized('Korisnik više ne postoji');
    if (user.is_blocked) throw ApiError.forbidden('Korisnički račun je blokiran');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: dopušta pristup samo navedenim ulogama (npr. 'admin').
 * @param {...string} roles
 */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Potrebne su veće ovlasti za ovu radnju'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
