// Contrat des repositories, vérifié sur la version mémoire : mêmes filtres, même
// pagination et mêmes champs que la version PostgreSQL, sans base ni serveur.
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { createMemoryRepositories } from "../src/repositories/memory/index.js";

const { hivesRepository, measuresRepository } = createMemoryRepositories();

test("filtre les ruches par site, comme la clause WHERE de la version SQL", async () => {
  const toutes = await hivesRepository.findAll();
  const snCasa = await hivesRepository.findAll({ site_id: "SN-CASA" });

  assert.ok(toutes.length > snCasa.length);
  assert.ok(snCasa.every((hive) => hive.site_id === "SN-CASA"));
  assert.equal(await hivesRepository.findById("SN-CASA-999"), null);
});

test("rend les mesures de la plus récente à la plus ancienne, page par page", async () => {
  const premiere = await measuresRepository.findByHive("SN-CASA-001", { limit: 2, offset: 0 });
  const seconde = await measuresRepository.findByHive("SN-CASA-001", { limit: 2, offset: 2 });

  assert.equal(premiere.length, 2);
  assert.ok(Date.parse(premiere[0].timestamp) > Date.parse(premiere[1].timestamp));
  // Une page ne recouvre jamais la précédente : la pagination n'est appliquée qu'une fois.
  assert.ok(premiere.every((mesure) => !seconde.includes(mesure)));
  assert.equal(premiere[0].site_id, "SN-CASA");
});
