// Contrôleur : que dit la requête, que répondre ? Il ne connaît ni repository ni SQL.
// Les erreurs remontent (Express 5 transmet les rejets async à l'intergiciel d'erreur).

export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async listHives(req, res) {
      res.json(await hivesService.listHives({ siteId: req.query.site_id }));
    },

    async getHive(req, res) {
      res.json(await hivesService.getHive(req.params.id));
    },

    async listMeasures(req, res) {
      res.json(await measuresService.listMeasures(req.params.id, { limit: req.query.limit, offset: req.query.offset }));
    },

    async addMeasure(req, res) {
      res.status(201).json(await measuresService.addMeasure(req.params.id, req.body));
    },

    async listInspections(req, res) {
      res.json(await inspectionsService.listInspections(req.params.id));
    },

    async addInspection(req, res) {
      res.status(201).json(await inspectionsService.addInspection(req.params.id, req.body));
    },
  };
}
