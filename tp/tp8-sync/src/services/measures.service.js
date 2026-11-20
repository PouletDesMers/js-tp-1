// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.
// Les types, les plages et les champs obligatoires sont déjà vérifiés par le schéma Joi :
// il ne reste ici que ce qui a besoin de la ruche — donc des droits de l'utilisateur.

import { ValidationError } from "../errors.js";

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async listMeasures(user, hiveId, { limit, offset }) {
      const hive = await hivesService.getHive(user, hiveId);
      return { items: await measuresRepository.findByHive(hive.id, { limit, offset }), limit, offset };
    },

    // Le repository décide si la trame est nouvelle ({ measure, created }) : rejouer
    // la même mesure n'est pas une erreur, c'est un 200 au lieu d'un 201.
    async addMeasure(user, hiveId, corps = {}) {
      const hive = await hivesService.getHive(user, hiveId);
      if (corps.hive_id !== undefined && corps.hive_id !== hive.id) {
        throw new ValidationError(
          `Le corps désigne la ruche ${corps.hive_id}, alors que le chemin désigne ${hive.id}.`,
        );
      }
      return measuresRepository.add({ ...corps, hive_id: hive.id });
    },
  };
}
