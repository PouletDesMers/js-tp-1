// Contrôleur : que dit la requête, que répondre ? Il ne connaît ni repository ni SQL.
// Il lit req.validated : les données sont déjà converties et validées par les schémas.
// Les erreurs remontent seules (Express 5 transmet les rejets async à l'intergiciel d'erreur).

export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async listHives(req, res) {
      res.json(await hivesService.listHives({ siteId: req.validated.site_id }));
    },

    async getHive(req, res) {
      res.json(await hivesService.getHive(req.params.id));
    },

    async listMeasures(req, res) {
      res.json(await measuresService.listMeasures(req.params.id, req.validated));
    },

    async addMeasure(req, res) {
      res.status(201).json(await measuresService.addMeasure(req.params.id, req.validated));
    },

    async listInspections(req, res) {
      res.json(await inspectionsService.listInspections(req.params.id));
    },

    async addInspection(req, res) {
      res.status(201).json(await inspectionsService.addInspection(req.params.id, req.validated));
    },
  };
}
