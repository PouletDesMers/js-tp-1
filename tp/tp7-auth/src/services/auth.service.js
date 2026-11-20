// Service d'authentification : compare les mots de passe, signe et vérifie les jetons.
// Il ne lit jamais req ni n'écrit res, et l'empreinte du mot de passe ne sort jamais d'ici.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../errors.js";

// Adresse inconnue ou mot de passe faux : même message, même temps de réponse.
const INVALID_CREDENTIALS = "Adresse e-mail ou mot de passe incorrect.";

// Empreinte factice : une adresse inconnue prend le même temps qu'un vrai compte.
const DUMMY_HASH = bcrypt.hashSync("mot-de-passe-factice", 10);

const ISSUER = "queenbee-api";
const AUDIENCE = "queenbee";
const ALGORITHM = "HS256";
const BCRYPT_ROUNDS = 10;

export function createAuthService({ usersRepository, auth }) {
  function lockedMessage(lockedUntil) {
    const heure = new Date(lockedUntil).toISOString().slice(11, 16);
    return `Compte bloqué après ${auth.maxFailedLogins} échecs de connexion, jusqu'à ${heure} UTC.`;
  }

  function issueTokens(user) {
    const options = { algorithm: ALGORITHM, issuer: ISSUER, audience: AUDIENCE, subject: user.id };
    return {
      token_type: "Bearer",
      access_token: jwt.sign({ type: "access", role: user.role, site_id: user.site_id }, auth.accessSecret, {
        ...options,
        expiresIn: auth.accessTtl,
      }),
      refresh_token: jwt.sign({ type: "refresh" }, auth.refreshSecret, {
        ...options,
        expiresIn: auth.refreshTtl,
      }),
    };
  }

  // Bonnes pratiques de la RFC 8725 : algorithme imposé, émetteur, audience et type vérifiés.
  function verify(token, secret, expectedType) {
    try {
      const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM], issuer: ISSUER, audience: AUDIENCE });
      return payload.type === expectedType ? payload : null;
    } catch {
      return null; // signature fausse, jeton expiré, jeton modifié…
    }
  }

  return {
    async login(email, password) {
      const user = await usersRepository.findByEmail(email.toLowerCase());
      if (!user) {
        await bcrypt.compare(password, DUMMY_HASH);
        throw new UnauthorizedError(INVALID_CREDENTIALS);
      }
      if (user.locked_until && user.locked_until > new Date()) {
        throw new UnauthorizedError(lockedMessage(user.locked_until));
      }
      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        const lockedUntil = await usersRepository.recordFailedLogin(user.id, auth.maxFailedLogins, auth.lockMinutes);
        throw new UnauthorizedError(lockedUntil ? lockedMessage(lockedUntil) : INVALID_CREDENTIALS);
      }
      await usersRepository.resetFailedLogins(user.id);
      return issueTokens(user);
    },

    async refresh(refreshToken) {
      const payload = verify(refreshToken, auth.refreshSecret, "refresh");
      if (!payload) {
        throw new UnauthorizedError("Jeton de renouvellement invalide ou expiré.");
      }
      // Le rôle a pu changer depuis l'émission : la paire repart de la base, pas du jeton.
      const user = await usersRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedError("Jeton de renouvellement invalide ou expiré.");
      }
      if (user.locked_until && user.locked_until > new Date()) {
        throw new UnauthorizedError(lockedMessage(user.locked_until));
      }
      return issueTokens(user);
    },

    async register({ email, password, role, site_id }) {
      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      // create ne renvoie que des colonnes publiques : pas d'empreinte dans la réponse.
      return usersRepository.create({ email: email.toLowerCase(), password_hash, role, site_id });
    },

    verifyAccessToken(token) {
      const payload = verify(token, auth.accessSecret, "access");
      if (!payload) {
        throw new UnauthorizedError("Jeton d'accès invalide ou expiré.");
      }
      return { id: payload.sub, role: payload.role, site_id: payload.site_id };
    },
  };
}
