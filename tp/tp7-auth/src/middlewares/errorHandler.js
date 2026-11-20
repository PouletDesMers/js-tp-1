// Intergiciels transverses : route inconnue, et traduction des erreurs en RFC 9457.
// Aucune réponse ne laisse voir une pile d'exécution ni du SQL.

import { AppError } from "../errors.js";
import { probleme } from "../problem.js";

// Un code HTTP, un titre : le corps reste identique pour tous les cas du même code.
const TITRES = {
  400: "Données invalides",
  404: "Ressource introuvable",
  409: "Conflit",
  413: "Contenu trop volumineux",
  500: "Erreur interne",
};

export function notFound(req, res) {
  probleme(res, 404, "Route inconnue", `Aucune route ne répond à ${req.method} ${req.originalUrl}.`);
}

// Quatre paramètres : c'est ce qui déclare l'intergiciel comme gestionnaire d'erreurs.
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return probleme(res, err.status, TITRES[err.status] ?? "Erreur", err.message);
  }
  if (err.type === "entity.parse.failed") {
    return probleme(res, 400, TITRES[400], "Le corps de la requête n'est pas un JSON valide.");
  }
  if (err.type === "entity.too.large") {
    return probleme(res, 413, TITRES[413], "Le corps de la requête dépasse 1 Mo.");
  }
  // 23505 : violation d'unicité (clé primaire comprise). Le message de PostgreSQL cite la
  // contrainte et les valeurs : il reste dans les journaux, jamais dans la réponse.
  if (err.code === "23505") {
    return probleme(res, 409, TITRES[409], "Cette ressource existe déjà.");
  }
  // 23503 : clé étrangère, 23514 : contrainte CHECK, 22P02 : valeur mal typée.
  if (["23503", "23514", "22P02"].includes(err.code)) {
    return probleme(res, 400, TITRES[400], "Les données ne respectent pas les contraintes de la base.");
  }
  console.error(err);
  probleme(res, 500, TITRES[500], "Une erreur interne est survenue.");
}
