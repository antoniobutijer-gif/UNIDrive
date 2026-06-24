'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const env = require('../config/env');
const userModel = require('../models/userModel');

/**
 * Autentikacijski modul (FZ-1).
 *
 * Prijava se obavlja putem AAI@EduHr (CARNET SSO). U produkciji bi se ovdje
 * obavila SAML razmjena s CARNET-ovim IdP-om. U prototipu nudimo:
 *
 *   POST /api/auth/aai/login   – "mock" prijava (development) ili razmjena AAI
 *                                tvrdnji (assertions) koje proslijedi frontend.
 *   GET  /api/auth/me          – dohvat trenutno prijavljenog korisnika.
 *
 * Ako student ne postoji u bazi, automatski se provizionira pri prvoj prijavi
 * (just-in-time provisioning) – standardna praksa kod AAI@EduHr integracija.
 */
const authController = {
  login: asyncHandler(async (req, res) => {
    const { aai_uid, first_name, last_name, email } = req.body;

    // AAI identitet može doći kao aai_uid ili kao e-mail (npr. ime@student.unidu.hr)
    const uid = (aai_uid || email || '').trim().toLowerCase();
    if (!uid) {
      throw ApiError.badRequest('Nedostaje AAI@EduHr identitet (aai_uid ili email)');
    }

    let user = await userModel.findByAaiUid(uid);

    if (!user) {
      if (!env.aai.allowDevLogin) {
        throw ApiError.unauthorized('Korisnik nije registriran u sustavu');
      }
      // Just-in-time provisioning novog studenta
      user = await userModel.create({
        aai_uid: uid,
        first_name: first_name || 'Student',
        last_name: last_name || uid.split('@')[0],
        role: 'student',
      });
    }

    if (user.is_blocked) {
      throw ApiError.forbidden('Vaš račun je blokiran. Obratite se administratoru.');
    }

    const token = signToken(user);
    res.json({ success: true, data: { token, user } });
  }),

  me: asyncHandler(async (req, res) => {
    const summary = await userModel.getRatingSummary(req.user.id);
    res.json({ success: true, data: { ...req.user, ...summary } });
  }),
};

module.exports = authController;
