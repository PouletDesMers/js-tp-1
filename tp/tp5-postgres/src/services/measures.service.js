// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.
// Les bornes de pagination restent ici ; leur application appartient au repository
// (LIMIT / OFFSET en SQL, découpage du tableau en mémoire).

import { ParametreInvalideError, ValidationError } from "../errors.js";
import { validerMesure } from "./validation.js";

const LIMITE_DEFAUT = 50;
const LIMITE_MAX = 500;

const entier = /^\d+$/;

function lireLimit(valeur) {
  if (valeur === undefined) return LIMITE_DEFAUT;
  if (typeof valeur !== "string" || !entier.test(valeur) || Number(valeur) < 1 || Number(valeur) > LIMITE_MAX) {
    throw new ParametreInvalideError(`limit doit être un entier de 1 à ${LIMITE_MAX}.`);
  }
  return Number(valeur);
}

function lireOffset(valeur) {
  if (valeur === undefined) return 0;
  if (typeof valeur !== "string" || !entier.test(valeur)) {
    throw new ParametreInvalideError("offset doit être un entier positif ou nul.");
  }
  return Number(valeur);
}

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async listMeasures(hiveId, { limit, offset } = {}) {
      const hive = await hivesService.getHive(hiveId);
      const page = { limit: lireLimit(limit), offset: lireOffset(offset) };
      return { items: await measuresRepository.findByHive(hive.id, page), ...page };
    },

    async addMeasure(hiveId, corps = {}) {
      const hive = await hivesService.getHive(hiveId);
      const detail = validerMesure(corps);
      if (detail) throw new ValidationError(detail);
      return measuresRepository.add({ hive_id: hive.id, timestamp: corps.timestamp, weight_kg: corps.weight_kg });
    },
  };
}
