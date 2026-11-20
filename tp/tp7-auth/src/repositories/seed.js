// Données de départ du mode mémoire : les mêmes que les TP 2 à 4.

import { existsSync, readFileSync } from "node:fs";
import hives from "../../../../data/hives.json" with { type: "json" };

export const hivesSeed = hives;

// Le fichier de 30 jours est exclu du dépôt (37 Mo) : on retombe sur celui d'un jour
// s'il n'a pas été généré, pour que le mode mémoire marche sur un dépôt fraîchement cloné.
const MESURES_30J = new URL("../../../../data/mesures-SN-CASA-2026-10-31_30j.ndjson", import.meta.url);
const MESURES_1J = new URL("../../../../data/mesures-SN-CASA-2026-10-31.ndjson", import.meta.url);
const fichierMesures = existsSync(MESURES_30J) ? MESURES_30J : MESURES_1J;

export const measuresSeed = readFileSync(fichierMesures, "utf8")
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
