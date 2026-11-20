// Les trois repositories en mémoire, sous les mêmes noms et les mêmes signatures que la
// version PostgreSQL : server.js choisit le stockage, app.js reçoit le même objet.

import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";

export function createMemoryRepositories() {
  return {
    hivesRepository: createHivesRepository(),
    measuresRepository: createMeasuresRepository(),
    inspectionsRepository: createInspectionsRepository(),
  };
}
