// Contrôleur : que dit la requête, que répondre ? Il ne connaît ni repository ni SQL.
// Il lit req.validated (données déjà converties et validées) et req.user (qui parle).
// Les erreurs remontent seules (Express 5 transmet les rejets async à l'intergiciel d'erreur).

export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async listHives(req, res) {
      res.json(await hivesService.listHives(req.user, req.validated));
    },

    async getHive(req, res) {
      res.json(await hivesService.getHive(req.user, req.params.id));
    },

    async listMeasures(req, res) {
      res.json(await measuresService.listMeasures(req.user, req.params.id, req.validated));
    },

    // 201 la première fois, 200 au rejeu : la trame n'est pas en double, elle est déjà là.
    async addMeasure(req, res) {
      const { measure, created } = await measuresService.addMeasure(req.user, req.params.id, req.validated);
      res.status(created ? 201 : 200).json(measure);
    },

    async listInspections(req, res) {
      res.json(await inspectionsService.listInspections(req.user, req.params.id));
    },

    // 201 la première fois, 200 au rejeu : l'UUID du client est la clé de l'idempotence.
    async addInspection(req, res) {
      const { inspection, created } = await inspectionsService.addInspection(req.user, req.params.id, req.validated);
      res.status(created ? 201 : 200).json(inspection);
    },
  };
}
