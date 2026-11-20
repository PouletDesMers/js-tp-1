// Réponse d'erreur au format RFC 9457 (application/problem+json).
export function probleme(res, status, title, detail) {
  res.status(status).type("application/problem+json").json({ type: "about:blank", title, status, detail });
}
