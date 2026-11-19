// Configuration lue à un seul endroit : le reste du code importe config.
// Lancement : node --env-file=.env tp/tp4-architecture/server.js

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
};

// Une configuration invalide arrête le démarrage.
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("PORT doit être un entier entre 1 et 65535.");
}
