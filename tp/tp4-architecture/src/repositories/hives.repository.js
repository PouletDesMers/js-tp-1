// Repository : où et comment sont les données. Il ne choisit aucun code HTTP.

import { hivesSeed } from "./seed.js";

export function createHivesRepository() {
  return {
    findAll() {
      return hivesSeed;
    },

    findById(id) {
      return hivesSeed.find((hive) => hive.id === id);
    },
  };
}
