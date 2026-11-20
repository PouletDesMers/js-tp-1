// Les trois repositories PostgreSQL, assemblés sous les mêmes noms que la version mémoire :
// server.js choisit le stockage, app.js reçoit le même objet dans les deux cas.

import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";

export function createPostgresRepositories(pool) {
  return {
    hivesRepository: createHivesRepository(pool),
    measuresRepository: createMeasuresRepository(pool),
    inspectionsRepository: createInspectionsRepository(pool),
  };
}
