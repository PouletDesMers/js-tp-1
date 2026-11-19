// Démarrage : le seul endroit qui choisit le stockage et le port.
// Demain, PostgreSQL : on remplace ces trois fabriques, app.js ne change pas.

import { createApp } from "./src/app.js";
import { createHivesRepository } from "./src/repositories/hives.repository.js";
import { createMeasuresRepository } from "./src/repositories/measures.repository.js";
import { createInspectionsRepository } from "./src/repositories/inspections.repository.js";

const PORT = 4000;

const app = createApp({
  hivesRepository: createHivesRepository(),
  measuresRepository: createMeasuresRepository(),
  inspectionsRepository: createInspectionsRepository(),
});

app.listen(PORT, () => {
  console.log(`API sur http://localhost:${PORT}`);
});
