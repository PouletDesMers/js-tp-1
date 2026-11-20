// Routeur : quelle URL, quel verbe, quel accès, quelle validation ? Aucune logique ici.
// requireAuth est monté en tête : aucune route des ruches n'est publique.

import express from "express";

import { requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { hivesQuerySchema, inspectionSchema, measureSchema, paginationSchema } from "../validators/schemas.js";

export function createHivesRouter({ controller, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  router.get("/", validate(hivesQuerySchema, "query"), controller.listHives);
  router.get("/:id", controller.getHive);
  router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);
  // L'admin simule la passerelle ; personne d'autre n'écrit une mesure.
  router.post("/:id/measures", requireRole("admin"), validate(measureSchema), controller.addMeasure);
  router.get("/:id/inspections", controller.listInspections);
  // Une inspection est saisie sur le terrain, par un apiculteur ou un coordinateur.
  router.post(
    "/:id/inspections",
    requireRole("apiculteur", "coordinateur"),
    validate(inspectionSchema),
    controller.addInspection,
  );

  return router;
}
