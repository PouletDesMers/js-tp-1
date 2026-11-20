// Repository mémoire : même contrat que la version PostgreSQL, sans base.

import { hivesSeed } from "../seed.js";

export function createHivesRepository() {
  return {
    async findAll({ site_id } = {}) {
      return site_id ? hivesSeed.filter((hive) => hive.site_id === site_id) : hivesSeed;
    },

    async findById(id) {
      return hivesSeed.find((hive) => hive.id === id) ?? null;
    },
  };
}
