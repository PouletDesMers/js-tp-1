// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.

import { NotFoundError } from "../errors.js";

export function createHivesService({ hivesRepository }) {
  return {
    async listHives({ siteId } = {}) {
      return hivesRepository.findAll({ site_id: siteId });
    },

    async getHive(id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      return hive;
    },
  };
}
