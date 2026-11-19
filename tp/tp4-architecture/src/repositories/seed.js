// Données de départ, en mémoire : les mêmes que les TP 2 et 3.
// Demain, seul le repository changera pour lire PostgreSQL.

import { readFileSync } from "node:fs";
import hives from "../../../../data/hives.json" with { type: "json" };

export const hivesSeed = hives;

export const measuresSeed = readFileSync(new URL("../../../../data/mesures-SN-CASA-2026-10-31_30j.ndjson", import.meta.url), "utf8")
  .split("\n")
  .filter((ligne) => ligne.trim())
  .map((ligne) => JSON.parse(ligne))
  .filter((mesure) => hives.some((hive) => hive.id === mesure.hive_id))
  .map(({ hive_id, timestamp, weight_kg }) => ({ hive_id, timestamp, weight_kg }));

export const inspectionsSeed = [
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
