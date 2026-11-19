// Repository : où et comment sont les inspections. Il ne choisit aucun code HTTP.

import { inspectionsSeed } from "./seed.js";

export function createInspectionsRepository() {
  const inspections = [...inspectionsSeed];

  return {
    findByHive(hiveId) {
      return inspections.filter((inspection) => inspection.hive_id === hiveId);
    },

    add(inspection) {
      inspections.push(inspection);
      return inspection;
    },
  };
}
