// Routeur : quelle URL, quel verbe ? Aucune logique ici.

import express from "express";

export function createHivesRouter(controller) {
  const router = express.Router();

  router.get("/", controller.listHives);
  router.get("/:id", controller.getHive);
  router.get("/:id/measures", controller.listMeasures);
  router.post("/:id/measures", controller.addMeasure);
  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", controller.addInspection);

  return router;
}
