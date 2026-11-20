// Démarrage : la seule ligne qui connaît la base et le port.
// Plus de mode mémoire au TP 7 : les comptes (table users) n'existent qu'en PostgreSQL.

import { createApp } from "./src/app.js";
import { config } from "./src/config.js";
import { createPostgresRepositories } from "./src/repositories/postgres/index.js";
import { createPool } from "./src/db.js";

const pool = createPool();
try {
  await pool.query("SELECT 1"); // un message clair maintenant, plutôt qu'une erreur à la 1re requête
} catch (err) {
  console.error(`Impossible de joindre PostgreSQL sur ${config.db.host}:${config.db.port} : ${err.message || err.code}`);
  process.exit(1);
}

const app = createApp(createPostgresRepositories(pool));

app.listen(config.port, () => {
  console.log(`API Queen Bee sur http://localhost:${config.port}`);
});
