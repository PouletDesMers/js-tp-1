// Repository mémoire : même contrat que la version PostgreSQL, sans base.

import { inspectionsSeed } from "../seed.js";

export function createInspectionsRepository() {
  const inspections = [...inspectionsSeed];

  return {
    async findByHive(hiveId) {
      return inspections.filter((inspection) => inspection.hive_id === hiveId);
    },

    async add(inspection) {
      inspections.push(inspection);
      return inspection;
    },
  };
}
