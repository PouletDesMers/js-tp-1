// Routeur de synchronisation : le lot hors connexion, réservé au terrain.
// Aucune logique ici.

import express from "express";

import { requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { syncSchema } from "../../validators/schemas.js";

export function createInspectionsRouter({ controller, requireAuth }) {
  const router = express.Router();

  router.post("/sync", requireAuth, requireRole("apiculteur", "coordinateur"), validate(syncSchema), controller.sync);

  return router;
}
