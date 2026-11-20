// Routeur : quelle URL, quel verbe, quelle validation ? Aucune logique ici.

import express from "express";

import { validate } from "../middlewares/validate.js";
import { hivesQuerySchema, inspectionSchema, measureSchema, paginationSchema } from "../validators/schemas.js";

export function createHivesRouter(controller) {
  const router = express.Router();

  router.get("/", validate(hivesQuerySchema, "query"), controller.listHives);
  router.get("/:id", controller.getHive);
  router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);
  router.post("/:id/measures", validate(measureSchema), controller.addMeasure);
  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", validate(inspectionSchema), controller.addInspection);

  return router;
}
