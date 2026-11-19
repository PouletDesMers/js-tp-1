# Queen Bee — backend Node.js

Fil rouge du module Backend Node.js : le socle d'une API Express pour les ruches connectées Queen Bee.

## Démarrage

```bash
cp .env-example .env        # puis choisir un mot de passe
docker compose up -d        # PostgreSQL + jeu de données (30 s à 1 min au premier lancement)
npm install
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
