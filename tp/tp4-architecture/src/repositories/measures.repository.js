// Repository : où et comment sont les mesures. Il ne choisit aucun code HTTP.

import { measuresSeed } from "./seed.js";

export function createMeasuresRepository() {
  const measures = [...measuresSeed];

  return {
    findByHive(hiveId) {
      return measures.filter((mesure) => mesure.hive_id === hiveId);
    },

    add(mesure) {
      measures.push(mesure);
      return mesure;
    },
  };
}
