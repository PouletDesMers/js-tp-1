// Test de la règle métier, sans base, sans serveur, sans ouvrir de port.
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { ValidationError } from "../src/errors.js";
import { createMeasuresService } from "../src/services/measures.service.js";

const mesureValide = { timestamp: "2026-10-31T12:00:00Z", weight_kg: 36.84 };

function createFakeHivesService() {
  return {
    getHive: async (id) => ({ id }),
  };
}

function createFakeMeasuresRepository() {
  const added = [];
  return {
    added,
    findByHive: () => [],
    add: (mesure) => {
      added.push(mesure);
      return mesure;
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

test("refuse un poids hors de sa plage physique", async () => {
  const { service, measuresRepository } = createService();

  await assert.rejects(
    () => service.addMeasure("SN-CASA-001", { ...mesureValide, weight_kg: 500 }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0);
});

test("enregistre une mesure valide", async () => {
  const { service, measuresRepository } = createService();

  const mesure = await service.addMeasure("SN-CASA-001", mesureValide);

  assert.deepEqual(mesure, { hive_id: "SN-CASA-001", ...mesureValide });
  assert.equal(measuresRepository.added.length, 1);
});
