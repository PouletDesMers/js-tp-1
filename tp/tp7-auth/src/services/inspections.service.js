// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.
// Les types, les plages et les champs obligatoires sont déjà vérifiés par le schéma Joi :
// il ne reste ici que ce qui a besoin de la ruche et de l'auteur.

import { ValidationError } from "../errors.js";

const plusRecentEnPremier = (a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at);

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async listInspections(user, hiveId) {
      const hive = await hivesService.getHive(user, hiveId);
      const items = await inspectionsRepository.findByHive(hive.id);
      return { items: items.sort(plusRecentEnPremier) };
    },

    async addInspection(user, hiveId, corps = {}) {
      const hive = await hivesService.getHive(user, hiveId);
      if (corps.hive_id !== undefined && corps.hive_id !== hive.id) {
        throw new ValidationError(
          `Le corps désigne la ruche ${corps.hive_id}, alors que le chemin désigne ${hive.id}.`,
        );
      }
      return inspectionsRepository.add({
        id: corps.id,
        hive_id: hive.id,
        author_id: user.id, // l'auteur est celui qui signe la requête, pas le propriétaire
        inspected_at: corps.inspected_at,
        queen_present: corps.queen_present ?? null,
        colony_status: corps.colony_status,
        observations: corps.observations ?? "",
      });
    },
  };
}
