// Configuration lue à un seul endroit : le reste du code importe config.
// Lancement : npm run dev (node --watch --env-file=.env tp/tp7-auth/server.js)
// Plus de mode mémoire au TP 7 : la table users n'existe qu'en base.

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "queenbee",
    database: process.env.DB_NAME ?? "queenbee",
    // Aucune valeur par défaut pour un mot de passe : il vient de .env, ou rien.
    password: process.env.DB_PASSWORD ?? "",
    poolMax: Number(process.env.DB_POOL_MAX ?? 10),
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
    maxFailedLogins: 5,
    lockMinutes: 15,
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
  Number.isInteger(config.db.port) && config.db.port >= 1 && config.db.port <= 65535,
  "DB_PORT doit être un entier entre 1 et 65535.",
);

verifier(
  Number.isInteger(config.db.poolMax) && config.db.poolMax >= 1,
  "DB_POOL_MAX doit être un entier supérieur ou égal à 1.",
);

verifier(config.db.password !== "", "DB_PASSWORD est obligatoire : renseignez-le dans .env.");

verifier(
  config.auth.accessSecret !== "",
  "JWT_ACCESS_SECRET est obligatoire : renseignez-le dans .env (32 octets aléatoires en hexadécimal).",
);

verifier(
  config.auth.refreshSecret !== "",
  "JWT_REFRESH_SECRET est obligatoire : renseignez-le dans .env (32 autres octets aléatoires).",
);

// Deux secrets identiques : un jeton de renouvellement passerait pour un jeton d'accès.
verifier(
  config.auth.accessSecret !== config.auth.refreshSecret,
  "JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.",
);
