# Contrat d'interface — API Queen Bee

API HTTP du socle backend Queen Bee. Les données viennent de PostgreSQL (base du jour 1) ; avec
`STORAGE=memory`, l'API repart des ruches de `data/hives.json` et du fichier de trames
`data/mesures-SN-CASA-2026-10-31.ndjson`.

## Conventions

- Base : `http://localhost:4000`, préfixe `/api`, **pas de version** dans le chemin.
- Corps et réponses en JSON UTF-8 (`Content-Type: application/json`).
- Les identifiants sont des chaînes : `SN-CASA-001` (ruche), UUID (inspection).
- Ressources au pluriel, jamais de verbe dans le chemin.
- Les paramètres de chemin et de requête arrivent en chaîne ; les nombres sont validés côté serveur.

## Erreurs — RFC 9457

Toutes les erreurs, **y compris route inconnue et JSON mal formé**, utilisent le format
`application/problem+json` :

```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant SN-CASA-999."
}
```

- `type` : `about:blank`, rien de plus que le code HTTP.
- `title` : intitulé du code, identique pour tous les cas du même code.
- `detail` : ce qui s'est passé pour cette requête.
- `status` : le code HTTP, répété dans le corps.

| Code | `title` | Quand |
| --- | --- | --- |
| 400 | `Paramètre invalide` | `limit` ou `offset` hors bornes, non entier |
| 400 | `Données invalides` | corps incomplet ou champ de type inattendu |
| 400 | `Corps JSON invalide` | corps annoncé JSON mais illisible |
| 404 | `Ressource introuvable` | ruche inconnue |
| 404 | `Route inconnue` | verbe ou chemin inexistant |
| 500 | `Erreur interne` | erreur inattendue du serveur |

Une erreur ne contient **jamais** de trace de pile ni de message interne : le détail technique reste
dans les journaux du serveur.

---

## GET /health

État du serveur.

**200**

```json
{ "status": "ok" }
```

---

## GET /api/hives

Liste des ruches.

**Paramètres de requête**

- `site_id` : facultatif, filtre par site (`SN-CASA`). Absent ou vide : pas de filtre.

**200**

```json
{
    { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
}
```

---

## GET /api/hives/:id

Une ruche.

**Paramètres de chemin**

- `id` : identifiant de la ruche (`SN-CASA-001`).

**200**

```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" }
```

**404** — aucune ruche ne porte cet identifiant.

```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant SN-CASA-999."
}
```

---

## GET /api/hives/:id/measures

Historique des mesures d'une ruche, **de la plus récente à la plus ancienne**.

**Paramètres de chemin**

- `id` : identifiant de la ruche.

**Paramètres de requête**

- `limit` : entier de 1 à 500, `50` par défaut.
- `offset` : entier positif ou nul, `0` par défaut.

**200**

```json
{
  "items": [
    { "hive_id": "SN-CASA-001", "timestamp": "2026-10-31T23:45:00.000Z", "weight_kg": 36.89, "site_id": "SN-CASA" },
    { "hive_id": "SN-CASA-001", "timestamp": "2026-10-31T23:30:00.000Z", "weight_kg": 36.81, "site_id": "SN-CASA" }
  ],
  "limit": 50,
  "offset": 0
}
```

`site_id` n'est pas une colonne de `measures` : il vient de `hives`, par jointure.

**400** — `limit` ou `offset` invalide.

```json
{
  "type": "about:blank",
  "title": "Paramètre invalide",
  "status": 400,
  "detail": "limit doit être un entier de 1 à 500."
}
```

**404** — aucune ruche ne porte cet identifiant.

---

## POST /api/hives/:id/measures

Ajoute une mesure à une ruche.

**Corps**

```json
{ "timestamp": "2026-10-31T12:00:00Z", "weight_kg": 36.84 }
```

- `timestamp` : date ISO 8601 de la trame, **jamais** l'heure de réception. Obligatoire.
- `weight_kg` : nombre strictement positif, au plus 200 kg (poids physique d'une ruche). Obligatoire.

**201**

```json
{ "hive_id": "SN-CASA-001", "timestamp": "2026-10-31T12:00:00.000Z", "weight_kg": 36.84, "site_id": "SN-CASA" }
```

**400** — corps incomplet.

```json
{
  "type": "about:blank",
  "title": "Données invalides",
  "status": 400,
  "detail": "timestamp (date ISO 8601) et weight_kg (nombre) sont obligatoires."
}
```

**404** — ruche inconnue.

---

## GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne.

**200**

```json
{
  "items": [
    {
      "id": "0b6c4a0e-6f1f-4d8e-8a1e-2f3d4c5b6a71",
      "hive_id": "SN-CASA-001",
      "inspected_at": "2026-10-24T08:15:00Z",
      "queen_present": true,
      "colony_status": "forte",
      "observations": "Couvain compact, réserves correctes."
    }
  ]
}
```

**404** — ruche inconnue.

---

## POST /api/hives/:id/inspections

Enregistre une inspection saisie sur le terrain. L'identifiant est un **UUID choisi par le client** :
l'inspection est créée hors connexion, avant tout appel au serveur.

**Corps**

```json
{
  "id": "3f2a9c1e-4b5d-4e6f-8a7b-9c0d1e2f3a4b",
  "inspected_at": "2026-10-14T09:30:00Z",
  "queen_present": true,
  "colony_status": "forte",
  "observations": "Couvain compact."
}
```

- `id` : UUID, obligatoire.
- `inspected_at` : date ISO 8601, obligatoire.
- `queen_present` : booléen, obligatoire.
- `colony_status` : `forte`, `normale`, `faible` ou `morte`, obligatoire.
- `observations` : texte libre, facultatif (`""` par défaut).

**201**

```json
{
  "id": "3f2a9c1e-4b5d-4e6f-8a7b-9c0d1e2f3a4b",
  "hive_id": "SN-CASA-001",
  "inspected_at": "2026-10-14T09:30:00Z",
  "queen_present": true,
  "colony_status": "forte",
  "observations": "Couvain compact."
}
```

**400** — champ manquant ou invalide, tous les problèmes listés dans `detail`.

```json
{
  "type": "about:blank",
  "title": "Données invalides",
  "status": 400,
  "detail": "id doit être un UUID ; colony_status doit valoir forte, normale, faible, morte"
}
```

**404** — ruche inconnue.
