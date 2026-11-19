// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.

import { ValidationError } from "../errors.js";
import { validerInspection } from "./validation.js";

const plusRecentEnPremier = (a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at);

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    listInspections(hiveId) {
      const hive = hivesService.getHive(hiveId);
      return { items: inspectionsRepository.findByHive(hive.id).sort(plusRecentEnPremier) };
    },

    addInspection(hiveId, corps = {}) {
      const hive = hivesService.getHive(hiveId);
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
