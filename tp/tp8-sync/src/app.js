// Le seul endroit où tout se branche : repositories → services → contrôleur → routeur.
// createApp ne démarre rien et ne choisit aucun stockage : tout est injecté par server.js.

import express from "express";
import morgan from "morgan";

import { config } from "./config.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createAuthService } from "./services/auth.service.js";

import { createHivesController } from "./controllers/hives.controller.js";
import { createAuthController } from "./controllers/auth.controller.js";
import { createInspectionsController } from "./controllers/inspections.controller.js";
import { createHivesRouter } from "./routes/hives.router.js";
import { createAuthRouter } from "./routes/auth/auth.router.js";
import { createInspectionsRouter } from "./routes/inspections/inspections.router.js";
import { createRequireAuth } from "./middlewares/auth.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

export function createApp({ hivesRepository, measuresRepository, inspectionsRepository, usersRepository }) {
  const authService = createAuthService({ usersRepository, auth: config.auth });
  const requireAuth = createRequireAuth(authService);

  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });

  const hivesController = createHivesController({ hivesService, measuresService, inspectionsService });

  const app = express();
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", createAuthRouter({ controller: createAuthController({ authService }), requireAuth }));
  app.use("/api/hives", createHivesRouter({ controller: hivesController, requireAuth }));
  app.use(
    "/api/inspections",
    createInspectionsRouter({
      controller: createInspectionsController({ inspectionsService }),
      requireAuth,
    }),
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
