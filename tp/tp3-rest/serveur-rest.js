// TP 3 — API REST : mesures paginées, inspections, erreurs RFC 9457.

import express from "express";
import morgan from "morgan";
import {
  hives,
  measures,
  inspections,
  probleme,
  trouverRuche,
  lirePagination,
  plusRecentEnPremier,
  validerMesure,
  validerInspection,
} from "./fonctions.js";

const app = express();

app.use(morgan("dev"));
app.use(express.json());

// GET /health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/hives
app.get("/api/hives", (req, res) => {
  const { site_id } = req.query;
  res.json(site_id ? hives.filter((hive) => hive.site_id === site_id) : hives);
});

// GET /api/hives/:id
app.get("/api/hives/:id", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;
  res.json(hive);
});

// GET /api/hives/:id/measures
app.get("/api/hives/:id/measures", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;
  const page = lirePagination(req, res);
  if (!page) return;
  const items = measures
    .filter((mesure) => mesure.hive_id === hive.id)
    .sort(plusRecentEnPremier("timestamp"))
    .slice(page.offset, page.offset + page.limit);
  res.json({ items, limit: page.limit, offset: page.offset });
});

// POST /api/hives/:id/measures
app.post("/api/hives/:id/measures", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;
  const corps = req.body ?? {};
  const detail = validerMesure(corps);
  if (detail) return probleme(res, 400, "Données invalides", detail);
  const mesure = { hive_id: hive.id, timestamp: corps.timestamp, weight_kg: corps.weight_kg };
  measures.push(mesure);
  res.status(201).json(mesure);
});

// GET /api/hives/:id/inspections
app.get("/api/hives/:id/inspections", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;
  const items = inspections
    .filter((inspection) => inspection.hive_id === hive.id)
    .sort(plusRecentEnPremier("inspected_at"));
  res.json({ items });
});

// POST /api/hives/:id/inspections
app.post("/api/hives/:id/inspections", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;
  const corps = req.body ?? {};
  const detail = validerInspection(corps);
  if (detail) return probleme(res, 400, "Données invalides", detail);
  const inspection = {
    id: corps.id,
    hive_id: hive.id,
    inspected_at: corps.inspected_at,
    queen_present: corps.queen_present,
    colony_status: corps.colony_status,
    observations: corps.observations ?? "",
  };
  inspections.push(inspection);
  res.status(201).json(inspection);
});

// Route inconnue : dernier intergiciel avant celui des erreurs.
app.use((req, res) => {
  probleme(res, 404, "Route inconnue", `Aucune route ne répond à ${req.method} ${req.originalUrl}.`);
});

// Intergiciel d'erreur : jamais de trace de pile dans la réponse.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return probleme(res, 400, "Corps JSON invalide", "Le corps de la requête n'est pas un JSON valide.");
  }
  console.error(err);
  probleme(res, 500, "Erreur interne", "Une erreur inattendue est survenue.");
});

app.listen(4000, () => {
  console.log("API sur http://localhost:4000");
});
