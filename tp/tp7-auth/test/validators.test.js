// Les schémas, testés à travers l'intergiciel validate : sans serveur, sans base.
// Lancement : npm test   (node --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { ValidationError } from "../src/errors.js";
import { validate } from "../src/middlewares/validate.js";
import { hivesQuerySchema, inspectionSchema, measureSchema, paginationSchema } from "../src/validators/schemas.js";

function run(schema, data, source = "body") {
  const req = { [source]: data };
  validate(schema, source)(req, {}, () => {});
  return req.validated;
}

const mesureValide = { timestamp: "2026-10-31T00:00:00Z", weight_kg: 36.84 };

const inspectionValide = {
  id: "3f2a9c1e-4b5d-4e6f-8a7b-9c0d1e2f3a4b",
  inspected_at: "2026-10-14T09:30:00Z",
  colony_status: "forte",
};

test("refuse un poids hors de sa plage physique", () => {
  assert.throws(() => run(measureSchema, { ...mesureValide, weight_kg: 500 }), ValidationError);
});

test("signale toutes les erreurs en une fois, en français", () => {
  assert.throws(() => run(measureSchema, { ...mesureValide, weight_kg: 500, humidity_pct: 120 }), {
    name: "ValidationError",
    message:
      "weight_kg doit être inférieur ou égal à 150.\nhumidity_pct doit être inférieur ou égal à 100.",
  });
});

test("nomme les champs obligatoires d'un corps vide", () => {
  assert.throws(() => run(measureSchema, {}), {
    message: "timestamp est obligatoire.\nweight_kg est obligatoire.",
  });
});

test("refuse un champ que le schéma ne déclare pas", () => {
  assert.throws(() => run(inspectionSchema, { ...inspectionValide, author_id: "x" }), {
    message: "author_id n'est pas un champ autorisé.",
  });
});

test("refuse une inspection datée du futur", () => {
  assert.throws(() => run(inspectionSchema, { ...inspectionValide, inspected_at: "2099-01-01T00:00:00Z" }), {
    message: "inspected_at ne peut pas être dans le futur.",
  });
});

test("convertit les paramètres de pagination et applique les défauts", () => {
  assert.deepEqual(run(paginationSchema, { limit: "2", offset: "4" }, "query"), { limit: 2, offset: 4 });
  assert.deepEqual(run(paginationSchema, {}, "query"), { limit: 50, offset: 0 });
  assert.throws(() => run(paginationSchema, { limit: "abc" }, "query"), {
    message: "limit doit être un nombre.",
  });
});

test("ne garde que le site dans la requête des ruches", () => {
  assert.deepEqual(run(hivesQuerySchema, { site_id: "SN-CASA" }, "query"), { site_id: "SN-CASA" });
  assert.deepEqual(run(hivesQuerySchema, {}, "query"), {});
  assert.throws(() => run(hivesQuerySchema, { site: "SN-CASA" }, "query"), {
    message: "site n'est pas un champ autorisé.",
  });
});
