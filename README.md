# Queen Bee — backend Node.js

Fil rouge du module Backend Node.js : le socle d'une API Express pour les ruches connectées Queen Bee.

## Démarrage

```bash
cp .env-example .env        # puis choisir un mot de passe
docker compose up -d        # PostgreSQL + jeu de données (30 s à 1 min au premier lancement)
npm install
npm run dev                 # API Queen Bee sur http://localhost:4000
```

Vérification : `docker compose exec db psql -U queenbee -d queenbee -c "SELECT count(*) FROM hives;"` → 400.

## TP 1 — lire les mesures sans bloquer la boucle

```bash
node scripts/generate-measures.js SN-CASA 2026-10-31 30      # fichier de 30 jours
node tp/tp1-lecture/serveur-depart.js data/mesures-SN-CASA-2026-10-31_30j.ndjson
node tp/tp1-lecture/sonde.js bloquant                        # dans un second terminal
node tp/tp1-lecture/sonde.js flux
```

Pire temps de réponse de `/ping` pendant un import, mesuré sur ce poste (Node 24, Linux) :

| Fichier | Lecture | Pire temps de `/ping` | Durée de l'import |
| --- | --- | --- | --- |
| 1 jour (4 800 lignes) | bloquante (`readFileSync`) | 11 ms | 14 ms |
| 1 jour (4 800 lignes) | en flux (`createReadStream` + `readline`) | 5 ms | 21 ms |
| 30 jours (144 000 lignes) | bloquante | 317 ms | 319 ms |
| 30 jours (144 000 lignes) | en flux | 8 ms | 365 ms |

Ce qui se passe dans la boucle d'événements : en bloquant, `readFileSync` puis `JSON.parse` sur les 144 000 lignes s'exécutent d'un seul trait dans le fil principal, donc `/ping` attend la fin de l'import. En flux, le fichier arrive par morceaux de 64 Ko et chaque `await` de la boucle `for await` rend la main, ce qui permet de répondre à `/ping` entre deux morceaux. Le flux n'est pas plus rapide (365 ms contre 319 ms), il est seulement interrompable — et l'écart disparaît sur un fichier d'un jour, trop court pour être visible.

## TP 5 — brancher l'API sur PostgreSQL

L'API lit et écrit dans la base Queen Bee au lieu de tableaux en mémoire. Le code est dans `tp/tp5-postgres/` : ce sont les couches du TP 4, auxquelles s'ajoutent un pool et deux jeux de repositories interchangeables.

```bash
npm run dev                                   # stockage : postgres (STORAGE=postgres dans .env)
STORAGE=memory npm run dev                    # ruches et mesures du jour 1, sans base
```

| Fichier | Rôle |
| --- | --- |
| `src/config.js` | `storage` (`STORAGE`, `postgres` par défaut) et l'objet `db` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_POOL_MAX`). Le démarrage s'arrête si `STORAGE` vaut autre chose que `postgres` ou `memory`, ou si `DB_PASSWORD` est vide en mode postgres. |
| `src/db.js` | Le pool `pg.Pool` et la conversion des `NUMERIC` en nombres (`setTypeParser(1700, …)`), pour que `weight_kg` vaille `36.83` et non `"36.83"`. |
| `src/repositories/postgres/` | Un fichier par repository, mêmes méthodes que la version mémoire : valeurs uniquement en paramètres (`$1`, `$2`…), colonnes listées une à une, alias qui rendent les noms de l'API (`measured_at AS timestamp`, `lat` → `position_lat` côté trame). |
| `src/repositories/memory/` | Les mêmes trois repositories, en mémoire : `STORAGE=memory` ne change rien d'autre. |
| `server.js` | Le seul endroit qui choisit le stockage ; il teste la connexion au démarrage pour échouer avec un message clair. |

Les noms ne sont pas les mêmes partout : `timestamp` est la colonne `measures.measured_at`, `position_lat` / `position_lon` sont `measures.lat` / `measures.lon`, et le `site_id` d'une mesure vient de `hives` par jointure. Aucune valeur ne sort de la requête pour être concaténée dans le SQL : `?site_id=SN-CASA' OR '1'='1` renvoie `[]`, la chaîne est restée une valeur.

Côté couches : `src/controllers` et `src/routes` n'ont pas bougé. Deux choses ont dû changer dans `src/services`, et rien d'autre : les repositories PostgreSQL sont asynchrones (`await hivesRepository.findById(…)`), et la pagination est maintenant appliquée par le repository (`LIMIT $2 OFFSET $3`) au lieu d'être découpée une seconde fois par le service après réception.

### Insertion en masse

`scripts/import-measures.js` insère la journée du 31 octobre, absente du jeu de données (4 800 mesures), en lisant le fichier en flux.

| Mode | Essai 1 | Essai 2 |
| --- | --- | --- |
| `ligne` (un `INSERT` par mesure) | 8 224 ms | 9 104 ms |
| `lot` (1 000 lignes par requête, une seule transaction) | 142 ms | 222 ms |

```bash
node --env-file=.env scripts/import-measures.js ligne --vider
node --env-file=.env scripts/import-measures.js lot --vider
```

Sans `--vider`, la seconde exécution échoue sur la clé primaire (`hive_id`, `measured_at`) : c'est voulu à ce stade, le TP 6 traduira l'erreur et le TP 8 rendra l'écriture rejouable.

### Les quatre questions

**1. Quel temps obtenez-vous dans chaque mode ? D'où vient l'écart ?**
8 à 9 secondes ligne à ligne, 140 à 220 ms par lot, soit environ 40 à 60 fois plus vite. Chaque `INSERT` isolé est sa propre transaction : PostgreSQL écrit et synchronise le journal sur disque (un `fsync`) à chaque fois, et le script paie 4 800 allers-retours réseau. Par lot, 1 000 lignes partent dans un seul aller-retour et les cinq requêtes ne produisent qu'un seul `COMMIT`, donc une seule synchronisation disque.

**2. Si la 2 001e mesure provoquait une erreur, que resterait-il en base dans chaque mode ?**
En mode `ligne`, les 2 000 premières mesures sont déjà validées, chacune dans sa transaction : elles restent en base et l'import s'arrête au milieu. En mode `lot`, la 2 001e mesure appartient au second lot : le `ROLLBACK` annule toute la transaction, donc rien ne reste, pas même les 1 000 premières.

**3. Pourquoi la transaction emprunte-t-elle une connexion avec `pool.connect()` au lieu d'appeler `pool.query()` ?**
Parce que `BEGIN`, les `INSERT` et `COMMIT` forment une seule session : `pool.query()` prend n'importe quelle connexion libre à chaque appel, si bien que le `BEGIN`, les insertions et le `COMMIT` pourraient atterrir sur trois connexions différentes et la transaction ne couvrirait plus les écritures. `pool.connect()` réserve une connexion du début à la fin, et `client.release()` la rend au pool.

**4. Que se passerait-il si `client.release()` n'était pas dans le `finally`, et qu'une erreur survenait dix fois de suite ?**
Chaque erreur laisserait sa connexion empruntée et jamais rendue. Au dixième échec, les dix connexions du pool (`DB_POOL_MAX=10`) seraient toutes retenues : les requêtes suivantes attendraient `connectionTimeoutMillis` (5 secondes) puis échoueraient, et l'API resterait bloquée jusqu'au redémarrage. Le `finally` rend la connexion dans tous les cas, y compris quand la transaction est annulée.
