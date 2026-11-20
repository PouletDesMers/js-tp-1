// Contrôleur de synchronisation : que dit la requête, que répondre ?
// Toujours 200 si le lot est bien formé : le détail de chaque élément est dans la réponse.

export function createInspectionsController({ inspectionsService }) {
  return {
    async sync(req, res) {
      res.json(await inspectionsService.syncInspections(req.user, req.validated.inspections));
    },
  };
}
