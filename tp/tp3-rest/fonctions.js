// TP 3 — Fonctions : données, validation et utilitaires.

import { readFileSync } from "node:fs";
import hives from "../../data/hives.json" with { type: "json" };

export { hives };

export const measures = readFileSync(new URL("../../data/mesures-SN-CASA-2026-10-31_30j_1.ndjson", import.meta.url), "utf8")
  .split("\n")
  .filter((ligne) => ligne.trim())
  .map((ligne) => JSON.parse(ligne))
  .filter((mesure) => hives.some((hive) => hive.id === mesure.hive_id))
  .map(({ hive_id, timestamp, weight_kg }) => ({ hive_id, timestamp, weight_kg }));

export const inspections = [
  {
    id: "0b6c4a0e-6f1f-4d8e-8a1e-2f3d4c5b6a71",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-24T08:15:00Z",
    queen_present: true,
    colony_status: "forte",
    observations: "Couvain compact, réserves correctes.",
  },
  {
    id: "1c7d5b1f-7f2a-4e9f-9b2f-3a4e5d6c7b82",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-14T07:40:00Z",
    queen_present: true,
    colony_status: "normale",
    observations: "",
  },
];

const COLONY_STATUS = ["forte", "normale", "faible", "morte"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const estDateIso = (valeur) => typeof valeur === "string" && DATE_ISO.test(valeur) && !Number.isNaN(Date.parse(valeur));

export function probleme(res, status, title, detail) {
  res.status(status).type("application/problem+json").json({ type: "about:blank", title, status, detail });
}

export function trouverRuche(req, res) {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    probleme(res, 404, "Ressource introuvable", `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
    return null;
  }
  return hive;
}

export function lirePagination(req, res) {
  const limit = req.query.limit ?? "50";
  const offset = req.query.offset ?? "0";
  if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 500) {
    probleme(res, 400, "Paramètre invalide", "limit doit être un entier de 1 à 500.");
    return null;
  }
  if (!/^\d+$/.test(offset)) {
    probleme(res, 400, "Paramètre invalide", "offset doit être un entier positif ou nul.");
    return null;
  }
  return { limit: Number(limit), offset: Number(offset) };
}

export const plusRecentEnPremier = (champ) => (a, b) => Date.parse(b[champ]) - Date.parse(a[champ]);

export function validerMesure(corps) {
  const { timestamp, weight_kg } = corps;
  if (!estDateIso(timestamp) || typeof weight_kg !== "number" || !Number.isFinite(weight_kg)) {
    return "timestamp (date ISO 8601) et weight_kg (nombre) sont obligatoires.";
  }
  return null;
}

export function validerInspection(corps) {
  const { id, inspected_at, queen_present, colony_status, observations } = corps;
  const erreurs = [];
  if (typeof id !== "string" || !UUID.test(id)) erreurs.push("id doit être un UUID");
  if (!estDateIso(inspected_at)) erreurs.push("inspected_at doit être une date ISO 8601");
  if (typeof queen_present !== "boolean") erreurs.push("queen_present doit être un booléen");
  if (!COLONY_STATUS.includes(colony_status)) erreurs.push(`colony_status doit valoir ${COLONY_STATUS.join(", ")}`);
  if (observations !== undefined && typeof observations !== "string") erreurs.push("observations doit être un texte");
  return erreurs.length > 0 ? erreurs.join(" ; ") : null;
}
