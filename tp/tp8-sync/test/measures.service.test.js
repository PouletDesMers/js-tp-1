// Test de la règle métier qui a besoin de la ruche et de l'utilisateur : sans base, sans serveur.

import { test } from "node:test";
import assert from "node:assert/strict";

import { NotFoundError, ValidationError } from "../src/errors.js";
import { createMeasuresService } from "../src/services/measures.service.js";

const admin = { id: "u-admin", role: "admin", site_id: null };
const mesureValide = { timestamp: new Date("2026-10-31T12:00:00Z"), weight_kg: 36.84 };

function createFakeHivesService() {
  return {
    async getHive(user, id) {
      if (id !== "SN-CASA-001") throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      return { id };
    },
  };
}

function createFakeMeasuresRepository() {
  const added = [];
  return {
    added,
    findByHive: () => [],
    // Comme le vrai repository : la mesure relue et le drapeau created.
    add: (mesure) => {
      const dejaVu = added.some((m) => m.hive_id === mesure.hive_id && +m.timestamp === +mesure.timestamp);
      if (!dejaVu) added.push(mesure);
      return { measure: mesure, created: !dejaVu };
    },
  };
}

function createService() {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({
    hivesService: createFakeHivesService(),
    measuresRepository,
  });
  return { service, measuresRepository };
}

test("refuse une ruche inconnue", async () => {
  const { service } = createService();

  await assert.rejects(() => service.addMeasure(admin, "SN-CASA-999", mesureValide), NotFoundError);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const { service, measuresRepository } = createService();

  await assert.rejects(
    () => service.addMeasure(admin, "SN-CASA-001", { ...mesureValide, hive_id: "SN-CASA-002" }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0); // rien n'a été enregistré
});

test("enregistre une mesure valide", async () => {
  const { service, measuresRepository } = createService();

  const { measure, created } = await service.addMeasure(admin, "SN-CASA-001", mesureValide);

  assert.equal(created, true);
  assert.deepEqual(measure, { hive_id: "SN-CASA-001", ...mesureValide });
  assert.equal(measuresRepository.added.length, 1);
});

test("rejouer la même mesure ne crée pas de doublon", async () => {
  const { service, measuresRepository } = createService();

  const premier = await service.addMeasure(admin, "SN-CASA-001", mesureValide);
  const second = await service.addMeasure(admin, "SN-CASA-001", mesureValide);

  assert.equal(premier.created, true);
  assert.equal(second.created, false);
  assert.deepEqual(second.measure, premier.measure); // la ligne relue, pas une nouvelle
  assert.equal(measuresRepository.added.length, 1);
});
