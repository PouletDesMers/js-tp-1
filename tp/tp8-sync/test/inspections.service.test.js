// Idempotence et verrouillage optimiste, testés sans base : le faux repository imite le SQL
// (INSERT … ON CONFLICT DO NOTHING, UPDATE … WHERE version = …).
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { ConflictError, ForbiddenError, NotFoundError } from "../src/errors.js";
import { createInspectionsService } from "../src/services/inspections.service.js";

const apiculteur = { id: "u-api1", role: "apiculteur", site_id: "SN-CASA" };

const ruches = {
  "SN-CASA-001": { id: "SN-CASA-001", site_id: "SN-CASA", owner_id: "u-api1" },
  "SN-CASA-002": { id: "SN-CASA-002", site_id: "SN-CASA", owner_id: "u-api1" },
  "SN-CASA-011": { id: "SN-CASA-011", site_id: "SN-CASA", owner_id: "u-api2" }, // à un autre apiculteur
};

const fakeHivesService = {
  async getHive(user, id) {
    const hive = ruches[id];
    if (!hive) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
    if (hive.owner_id !== user.id) throw new ForbiddenError(`Vous n'avez pas accès à la ruche ${id}.`);
    return hive;
  },
};

function createFakeInspectionsRepository() {
  const rows = new Map();
  return {
    rows,
    async findById(id) {
      return rows.get(id) ?? null;
    },
    async findByHive(hiveId) {
      return [...rows.values()].filter((i) => i.hive_id === hiveId);
    },
    async insertIfAbsent(inspection) {
      if (rows.has(inspection.id)) return { inspection: rows.get(inspection.id), created: false };
      const stored = { ...inspection, version: 1 };
      rows.set(inspection.id, stored);
      return { inspection: stored, created: true };
    },
    async updateIfVersion(inspection, expectedVersion) {
      const current = rows.get(inspection.id);
      if (!current || current.hive_id !== inspection.hive_id || current.version !== expectedVersion) return null;
      const updated = { ...current, ...inspection, author_id: current.author_id, version: current.version + 1 };
      rows.set(inspection.id, updated);
      return updated;
    },
  };
}

const inspection = {
  id: "0b6c4a0e-6f1f-4d8e-9a39-2f3c9b1d7e55",
  inspected_at: "2026-11-01T09:30:00Z",
  colony_status: "forte",
};

function createService() {
  const inspectionsRepository = createFakeInspectionsRepository();
  return {
    service: createInspectionsService({ hivesService: fakeHivesService, inspectionsRepository }),
    inspectionsRepository,
  };
}

test("envoyer deux fois la même inspection ne crée pas de doublon", async () => {
  const { service, inspectionsRepository } = createService();

  const premier = await service.addInspection(apiculteur, "SN-CASA-001", inspection);
  const second = await service.addInspection(apiculteur, "SN-CASA-001", inspection);

  assert.equal(premier.created, true);
  assert.equal(second.created, false);
  assert.equal(second.inspection.version, 1); // la ligne déjà en base, pas une nouvelle
  assert.equal(inspectionsRepository.rows.size, 1);
});

test("le même identifiant sur une autre ruche donne 409", async () => {
  const { service } = createService();
  await service.addInspection(apiculteur, "SN-CASA-001", inspection);

  await assert.rejects(() => service.addInspection(apiculteur, "SN-CASA-002", inspection), ConflictError);
});

test("une version périmée donne un conflit, et le serveur garde sa donnée", async () => {
  const { service, inspectionsRepository } = createService();
  await service.addInspection(apiculteur, "SN-CASA-001", inspection);
  // Un autre appareil a modifié l'inspection : elle passe en version 2.
  await inspectionsRepository.updateIfVersion(
    { ...inspection, hive_id: "SN-CASA-001", colony_status: "faible" },
    1,
  );

  const { results } = await service.syncInspections(apiculteur, [
    { ...inspection, hive_id: "SN-CASA-001", colony_status: "morte", version: 1 },
  ]);

  assert.equal(results[0].status, "conflict");
  assert.equal(results[0].current.version, 2);
  assert.equal(results[0].current.colony_status, "faible"); // la saisie de l'appareil est refusée
  assert.equal(inspectionsRepository.rows.get(inspection.id).colony_status, "faible");
});

test("le lot donne un statut par élément et n'arrête pas au premier refus", async () => {
  const { service } = createService();
  const autre = { ...inspection, id: "1b6c4a0e-6f1f-4d8e-9a39-2f3c9b1d7e66" };
  await service.addInspection(apiculteur, "SN-CASA-001", inspection); // déjà connu du serveur

  const { summary, results } = await service.syncInspections(apiculteur, [
    { ...inspection, hive_id: "SN-CASA-001" }, // unchanged
    { ...autre, hive_id: "SN-CASA-001" }, // created
    { ...autre, hive_id: "SN-CASA-001", version: 1, colony_status: "normale" }, // updated
    { ...inspection, hive_id: "SN-CASA-001", version: 99 }, // conflict
    { ...inspection, id: "2b6c4a0e-6f1f-4d8e-9a39-2f3c9b1d7e77", hive_id: "SN-CASA-011" }, // rejected (droits)
  ]);

  assert.deepEqual(
    results.map((r) => r.status),
    ["unchanged", "created", "updated", "conflict", "rejected"],
  );
  assert.deepEqual(summary, { created: 1, unchanged: 1, updated: 1, conflict: 1, rejected: 1 });
  assert.equal(results[2].version, 2); // version incrémentée par le serveur
  assert.match(results[4].detail, /Vous n'avez pas accès à la ruche SN-CASA-011\./);
});
