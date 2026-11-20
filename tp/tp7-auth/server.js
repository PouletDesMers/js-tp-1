// Démarrage : la seule ligne qui connaît le stockage et le port.

import { createApp } from "./src/app.js";
import { config } from "./src/config.js";
import { createMemoryRepositories } from "./src/repositories/memory/index.js";
import { createPostgresRepositories } from "./src/repositories/postgres/index.js";
import { createPool } from "./src/db.js";

let repositories;

if (config.storage === "postgres") {
  const pool = createPool();
  try {
    await pool.query("SELECT 1"); // un message clair maintenant, plutôt qu'une erreur à la 1re requête
  } catch (err) {
    console.error(`Impossible de joindre PostgreSQL sur ${config.db.host}:${config.db.port} : ${err.message || err.code}`);
    process.exit(1);
  }
  repositories = createPostgresRepositories(pool);
} else {
  repositories = createMemoryRepositories();
}

const app = createApp(repositories);

app.listen(config.port, () => {
  console.log(`API Queen Bee sur http://localhost:${config.port} (stockage : ${config.storage})`);
});
