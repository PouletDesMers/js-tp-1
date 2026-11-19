// TP 2 — Premières routes Express sur des données en mémoire.

import express from "express";
import morgan from "morgan";
import hives from "../../data/hives.json" with { type: "json" };

const app = express();

// Intergiciel maison 
// Remplacer par morgan
function requestLogger(req, res, next) {
  const debut = performance.now();
  res.on("finish", () => {
    const duree = (performance.now() - debut).toFixed(1);
    console.log(req.method, req.originalUrl, res.statusCode, `${duree} ms`);
  });
  next();
}

// app.use(requestLogger);
app.use(morgan("dev"));
app.use(express.json());

// Données Importées depuis data/hives.json
const measures = [];

app.get("/api/hives", (req, res) => {
  const { site_id } = req.query;
  res.json(site_id ? hives.filter((hive) => hive.site_id === site_id) : hives);
});

app.get("/api/hives/:id", (req, res) => {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ detail: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
  }
  res.json(hive);
});

app.post("/api/hives/:id/measures", (req, res) => {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ detail: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
  }
  const mesure = {
    hive_id: hive.id,
    measured_at: req.body.timestamp,
    weight_kg: req.body.weight_kg,
  };
  measures.push(mesure);
  res.status(201).json(mesure);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(4000, () => {
  console.log("API sur http://localhost:4000");
});
