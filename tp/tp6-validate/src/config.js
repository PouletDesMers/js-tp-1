// Configuration lue à un seul endroit : le reste du code importe config.
// Lancement : npm run dev (node --watch --env-file=.env tp/tp5-postgres/server.js)

const STORAGES = ["postgres", "memory"];

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  storage: process.env.STORAGE ?? "postgres",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "queenbee",
    database: process.env.DB_NAME ?? "queenbee",
    // Aucune valeur par défaut pour un mot de passe : il vient de .env, ou rien.
    password: process.env.DB_PASSWORD ?? "",
    poolMax: Number(process.env.DB_POOL_MAX ?? 10),
  },
};

// Une configuration invalide arrête le démarrage.
function verifier(condition, message) {
  if (!condition) throw new Error(message);
}

verifier(
  Number.isInteger(config.port) && config.port >= 1 && config.port <= 65535,
  "PORT doit être un entier entre 1 et 65535.",
);

verifier(
  STORAGES.includes(config.storage),
  `STORAGE doit valoir ${STORAGES.join(" ou ")}, reçu « ${config.storage} ».`,
);

verifier(
  Number.isInteger(config.db.port) && config.db.port >= 1 && config.db.port <= 65535,
  "DB_PORT doit être un entier entre 1 et 65535.",
);

verifier(
  Number.isInteger(config.db.poolMax) && config.db.poolMax >= 1,
  "DB_POOL_MAX doit être un entier supérieur ou égal à 1.",
);

if (config.storage === "postgres") {
  verifier(config.db.password !== "", "DB_PASSWORD est obligatoire quand STORAGE vaut postgres : renseignez-le dans .env.");
}
