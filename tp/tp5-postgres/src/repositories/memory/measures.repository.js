// Repository mémoire : même contrat que la version PostgreSQL, sans base.
// La pagination est appliquée ici, comme le LIMIT / OFFSET de la version SQL.

import { hivesSeed, measuresSeed } from "../seed.js";

const plusRecentEnPremier = (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp);
const siteDeLaRuche = new Map(hivesSeed.map((hive) => [hive.id, hive.site_id]));

export function createMeasuresRepository() {
  const mesures = measuresSeed.map((mesure) => ({ ...mesure, site_id: siteDeLaRuche.get(mesure.hive_id) }));

  return {
    async findByHive(hiveId, { limit = null, offset = 0 } = {}) {
      const deLaRuche = mesures.filter((mesure) => mesure.hive_id === hiveId).sort(plusRecentEnPremier);
      return limit === null ? deLaRuche.slice(offset) : deLaRuche.slice(offset, offset + limit);
    },

    async add(mesure) {
      const ajoutee = { ...mesure, site_id: siteDeLaRuche.get(mesure.hive_id) };
      mesures.push(ajoutee);
      return ajoutee;
    },
  };
}
