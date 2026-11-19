// TP 2 — Premières routes Express sur des données en mémoire.

import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("API sur http://localhost:3000");
});
