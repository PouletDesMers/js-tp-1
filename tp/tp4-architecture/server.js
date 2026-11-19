// Démarrage : la seule ligne qui connaît le stockage et le port.

import { createApp } from "./src/app.js";
import { config } from "./src/config.js";
import { createHivesRepository } from "./src/repositories/hives.repository.js";
import { createMeasuresRepository } from "./src/repositories/measures.repository.js";
import { createInspectionsRepository } from "./src/repositories/inspections.repository.js";

const app = createApp({
  hivesRepository: createHivesRepository(),
  measuresRepository: createMeasuresRepository(),
  inspectionsRepository: createInspectionsRepository(),
});

app.listen(config.port, () => {
  console.log(`API sur http://localhost:${config.port} (${config.env})`);
});
