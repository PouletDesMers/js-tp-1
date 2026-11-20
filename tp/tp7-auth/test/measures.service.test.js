// Test de la règle métier qui a besoin de la ruche : sans base, sans serveur, sans port.
// Les types et les plages sont testés dans validators.test.js : le service ne les voit plus.
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { NotFoundError, ValidationError } from "../src/errors.js";
import { createMeasuresService } from "../src/services/measures.service.js";

const mesureValide = { timestamp: new Date("2026-10-31T12:00:00Z"), weight_kg: 36.84 };

function createFakeHivesService() {
  return {
    async getHive(id) {
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

test("refuse une ruche inconnue", async () => {
  const { service } = createService();

  await assert.rejects(() => service.addMeasure("SN-CASA-999", mesureValide), NotFoundError);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const { service, measuresRepository } = createService();

  await assert.rejects(
    () => service.addMeasure("SN-CASA-001", { ...mesureValide, hive_id: "SN-CASA-002" }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0); // rien n'a été enregistré
});

test("enregistre une mesure valide", async () => {
  const { service, measuresRepository } = createService();

  const mesure = await service.addMeasure("SN-CASA-001", mesureValide);

  assert.deepEqual(mesure, { hive_id: "SN-CASA-001", ...mesureValide });
  assert.equal(measuresRepository.added.length, 1);
});
