// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.

import { NotFoundError } from "../errors.js";

export function createHivesService({ hivesRepository }) {
  return {
    async listHives({ siteId } = {}) {
      const hives = hivesRepository.findAll();
      return siteId ? hives.filter((hive) => hive.site_id === siteId) : hives;
    },

    async getHive(id) {
      const hive = hivesRepository.findById(id);
      if (!hive) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      return hive;
    },
  };
}
