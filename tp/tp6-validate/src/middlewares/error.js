// Intergiciels transverses : route inconnue, et traduction des erreurs en RFC 9457.

import { HttpError } from "../errors.js";
import { probleme } from "../problem.js";

export function notFound(req, res) {
  probleme(res, 404, "Route inconnue", `Aucune route ne répond à ${req.method} ${req.originalUrl}.`);
}

// Jamais de trace de pile dans la réponse : le détail technique reste dans les journaux.
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return probleme(res, err.status, err.title, err.detail);
  }
  if (err.type === "entity.parse.failed") {
    return probleme(res, 400, "Corps JSON invalide", "Le corps de la requête n'est pas un JSON valide.");
  }
  console.error(err);
  probleme(res, 500, "Erreur interne", "Une erreur inattendue est survenue.");
}
