// Le seul endroit où tout se branche : repositories → services → contrôleur → routeur.
// createApp ne démarre rien : les tests peuvent créer l'application sans ouvrir de port.

import express from "express";
import morgan from "morgan";

import { createHivesRepository } from "./repositories/hives.repository.js";
import { createMeasuresRepository } from "./repositories/measures.repository.js";
import { createInspectionsRepository } from "./repositories/inspections.repository.js";

import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";

import { createHivesController } from "./controllers/hives.controller.js";
import { createHivesRouter } from "./routes/hives.router.js";
import { errorHandler, notFound } from "./middlewares/error.js";

export function createApp({
  hivesRepository = createHivesRepository(),
  measuresRepository = createMeasuresRepository(),
  inspectionsRepository = createInspectionsRepository(),
} = {}) {
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });

  const controller = createHivesController({ hivesService, measuresService, inspectionsService });

  const app = express();
  app.use(morgan("dev"));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/hives", createHivesRouter(controller));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
