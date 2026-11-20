// La règle d'accès, testée sans base ni serveur : on donne un utilisateur et une ruche.
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { ForbiddenError, NotFoundError } from "../src/errors.js";
import { canAccessHive, createHivesService } from "../src/services/hives.service.js";

const ruche = { id: "SN-CASA-001", site_id: "SN-CASA", owner_id: "u-api1" };

test("canAccessHive : chaque rôle voit ce qu'il doit voir", () => {
  assert.equal(canAccessHive({ id: "u-admin", role: "admin", site_id: null }, ruche), true);
  assert.equal(canAccessHive({ id: "u-gest", role: "gestionnaire", site_id: null }, ruche), true);
  assert.equal(canAccessHive({ id: "u-coord", role: "coordinateur", site_id: "SN-CASA" }, ruche), true);
  assert.equal(canAccessHive({ id: "u-coord2", role: "coordinateur", site_id: "CI-AGBO" }, ruche), false);
  assert.equal(canAccessHive({ id: "u-api1", role: "apiculteur", site_id: "SN-CASA" }, ruche), true);
  assert.equal(canAccessHive({ id: "u-api2", role: "apiculteur", site_id: "SN-CASA" }, ruche), false);
});

function createService(hive) {
  return createHivesService({
    hivesRepository: { findById: async () => hive, findAll: async () => [] },
  });
}

test("une ruche inexistante donne 404, avant tout contrôle de droits", async () => {
  const service = createService(null);
  const apiculteur = { id: "u-api1", role: "apiculteur", site_id: "SN-CASA" };

  await assert.rejects(() => service.getHive(apiculteur, "XX-NOPE-999"), NotFoundError);
});

test("une ruche existante mais hors des droits donne 403", async () => {
  const service = createService(ruche);
  const apiculteur = { id: "u-api2", role: "apiculteur", site_id: "SN-CASA" };

  await assert.rejects(() => service.getHive(apiculteur, "SN-CASA-001"), {
    name: "ForbiddenError",
    message: "Vous n'avez pas accès à la ruche SN-CASA-001.",
  });
});

test("un coordinateur ne peut pas demander un autre site, mais voit le sien", async () => {
  const vus = [];
  const service = createHivesService({
    hivesRepository: {
      findAll: async (filtre) => {
        vus.push(filtre);
        return [];
      },
    },
  });
  const coordinateur = { id: "u-coord", role: "coordinateur", site_id: "SN-CASA" };

  await assert.rejects(() => service.listHives(coordinateur, { site_id: "CI-AGBO" }), ForbiddenError);
  await service.listHives(coordinateur, {});
  assert.deepEqual(vus, [{ site_id: "SN-CASA" }]); // son site, toujours
});
