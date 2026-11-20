// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.
// Les bornes de pagination restent ici ; leur application appartient au repository
// (LIMIT / OFFSET en SQL, découpage du tableau en mémoire).

import { ValidationError } from "../errors.js";
import { validerInspection } from "./validation.js";

const plusRecentEnPremier = (a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at);

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async listInspections(hiveId) {
      const hive = await hivesService.getHive(hiveId);
      const items = await inspectionsRepository.findByHive(hive.id);
      return { items: items.sort(plusRecentEnPremier) };
    },

    async addInspection(hiveId, corps = {}) {
      const hive = await hivesService.getHive(hiveId);
      const detail = validerInspection(corps);
      if (detail) throw new ValidationError(detail);
      return inspectionsRepository.add({
        id: corps.id,
        hive_id: hive.id,
        inspected_at: corps.inspected_at,
        queen_present: corps.queen_present,
        colony_status: corps.colony_status,
        observations: corps.observations ?? "",
      });
    },
  };
}
