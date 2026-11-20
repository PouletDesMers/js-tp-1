// Erreurs typées : les couches basses ne connaissent pas HTTP,
// c'est l'intergiciel d'erreur qui traduit en réponse.

export class HttpError extends Error {
  constructor(status, title, detail) {
    super(detail);
    this.status = status;
    this.title = title;
    this.detail = detail;
  }
}

export class NotFoundError extends HttpError {
  constructor(detail) {
    super(404, "Ressource introuvable", detail);
  }
}

export class ValidationError extends HttpError {
  constructor(detail) {
    super(400, "Données invalides", detail);
  }
}

export class ParametreInvalideError extends HttpError {
  constructor(detail) {
    super(400, "Paramètre invalide", detail);
  }
}
