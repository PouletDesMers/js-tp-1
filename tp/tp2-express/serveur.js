// TP 2 — Premières routes Express sur des données en mémoire.

import express from "express";

const app = express();

app.use(express.json());

// Quelques ruches du jeu de données, en mémoire pour ce TP.
const hives = [
  { id: "CI-MAN-001", site_id: "CI-MAN", status: "active" },
  { id: "CM-BAFO-001", site_id: "CM-BAFO", status: "active" },
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "SN-KOLD-001", site_id: "SN-KOLD", status: "active" },
];

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

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("API sur http://localhost:3000");
});
