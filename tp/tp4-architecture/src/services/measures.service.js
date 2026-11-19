// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.

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

const plusRecentEnPremier = (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp);

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    listMeasures(hiveId, { limit, offset } = {}) {
      const hive = hivesService.getHive(hiveId);
      const page = { limit: lireLimit(limit), offset: lireOffset(offset) };
      const items = measuresRepository
        .findByHive(hive.id)
        .sort(plusRecentEnPremier)
        .slice(page.offset, page.offset + page.limit);
      return { items, ...page };
    },

    addMeasure(hiveId, corps = {}) {
      const hive = hivesService.getHive(hiveId);
      const detail = validerMesure(corps);
      if (detail) throw new ValidationError(detail);
      return measuresRepository.add({ hive_id: hive.id, timestamp: corps.timestamp, weight_kg: corps.weight_kg });
    },
  };
}
