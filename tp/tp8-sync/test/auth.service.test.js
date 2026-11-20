// Le service d'authentification, testé sans base : un faux repository suffit.
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import bcrypt from "bcryptjs";

import { UnauthorizedError } from "../src/errors.js";
import { createAuthService } from "../src/services/auth.service.js";

const auth = {
  accessSecret: "a".repeat(32),
  refreshSecret: "b".repeat(32),
  accessTtl: "15m",
  refreshTtl: "7d",
  maxFailedLogins: 5,
  lockMinutes: 15,
};

const MOT_DE_PASSE = "MotDePasseLong1!";
const empreinte = bcrypt.hashSync(MOT_DE_PASSE, 4);

function createFakeUsersRepository(user = null) {
  const comptes = new Map();
  if (user) comptes.set(user.email, { ...user, failed_attempts: 0, locked_until: null });

  return {
    comptes,
    async findByEmail(email) {
      return comptes.get(email) ?? null;
    },
    async findById(id) {
      return [...comptes.values()].find((c) => c.id === id) ?? null;
    },
    async create({ email, password_hash, role, site_id }) {
      const cree = { id: "u-nouveau", email, password_hash, role, site_id, created_at: new Date() };
      comptes.set(email, cree);
      return { id: cree.id, email, role, site_id, created_at: cree.created_at }; // jamais password_hash
    },
    async resetFailedLogins(id) {
      const compte = [...comptes.values()].find((c) => c.id === id);
      if (compte) {
        compte.failed_attempts = 0;
        compte.locked_until = null;
      }
    },
    async recordFailedLogin(id, maxFailed, lockMinutes) {
      const compte = [...comptes.values()].find((c) => c.id === id);
      compte.failed_attempts += 1;
      if (compte.failed_attempts >= maxFailed) {
        compte.failed_attempts = 0;
        compte.locked_until = new Date(Date.now() + lockMinutes * 60_000);
      }
      return compte.locked_until;
    },
  };
}

function createService(user) {
  const usersRepository = createFakeUsersRepository(user);
  return { service: createAuthService({ usersRepository, auth }), usersRepository };
}

const compte = {
  id: "0b6c4a0e-6f1f-4d8e-8a1e-2f3d4c5b6a71",
  email: "admin@queenbee.test",
  password_hash: empreinte,
  role: "admin",
  site_id: null,
  locked_until: null,
};

test("adresse inconnue et mot de passe faux donnent le même message", async () => {
  const { service } = createService(compte);

  await assert.rejects(() => service.login("personne@queenbee.test", "faux"), {
    name: "UnauthorizedError",
    message: "Adresse e-mail ou mot de passe incorrect.",
  });
  await assert.rejects(() => service.login("admin@queenbee.test", "faux"), {
    name: "UnauthorizedError",
    message: "Adresse e-mail ou mot de passe incorrect.",
  });
});

test("la connexion renvoie deux jetons de types différents", async () => {
  const { service } = createService(compte);

  const jetons = await service.login("admin@queenbee.test", MOT_DE_PASSE);

  assert.equal(jetons.token_type, "Bearer");
  assert.deepEqual(service.verifyAccessToken(jetons.access_token), {
    id: compte.id,
    role: "admin",
    site_id: null,
  });
  // Un jeton de renouvellement ne passe jamais pour un jeton d'accès.
  assert.throws(() => service.verifyAccessToken(jetons.refresh_token), UnauthorizedError);
});

test("un jeton modifié est refusé", async () => {
  const { service } = createService(compte);
  const { access_token } = await service.login("admin@queenbee.test", MOT_DE_PASSE);
  const [entete, charge, signature] = access_token.split(".");
  const falsifie = `${entete}.${charge.slice(0, -1)}${charge.endsWith("A") ? "B" : "A"}.${signature}`;

  assert.throws(() => service.verifyAccessToken(falsifie), {
    message: "Jeton d'accès invalide ou expiré.",
  });
});

test("le cinquième échec bloque le compte, même avec le bon mot de passe ensuite", async () => {
  const { service } = createService(compte);

  for (let essai = 1; essai <= 4; essai += 1) {
    await assert.rejects(() => service.login("admin@queenbee.test", "faux"), {
      message: "Adresse e-mail ou mot de passe incorrect.",
    });
  }
  await assert.rejects(() => service.login("admin@queenbee.test", "faux"), {
    message: /^Compte bloqué après 5 échecs de connexion, jusqu'à \d{2}:\d{2} UTC\.$/,
  });
  await assert.rejects(() => service.login("admin@queenbee.test", MOT_DE_PASSE), {
    name: "UnauthorizedError",
    message: /^Compte bloqué/,
  });
});

test("le renouvellement relit le rôle en base, pas dans le jeton", async () => {
  const { service, usersRepository } = createService(compte);
  const { refresh_token } = await service.login("admin@queenbee.test", MOT_DE_PASSE);

  usersRepository.comptes.get(compte.email).role = "gestionnaire"; // rôle changé entre-temps
  const jetons = await service.refresh(refresh_token);

  assert.equal(service.verifyAccessToken(jetons.access_token).role, "gestionnaire");
});

test("register hache le mot de passe et ne renvoie jamais l'empreinte", async () => {
  const { service, usersRepository } = createService(null);

  const cree = await service.register({
    email: "nouveau@queenbee.test",
    password: MOT_DE_PASSE,
    role: "gestionnaire",
  });

  assert.equal(cree.email, "nouveau@queenbee.test");
  assert.equal("password_hash" in cree, false);
  const enBase = usersRepository.comptes.get("nouveau@queenbee.test");
  assert.notEqual(enBase.password_hash, MOT_DE_PASSE);
  assert.equal(await bcrypt.compare(MOT_DE_PASSE, enBase.password_hash), true);
});
