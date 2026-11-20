# Contrat d'interface — API Queen Bee

API HTTP du socle backend Queen Bee. Les données viennent de PostgreSQL (base du jour 1). Le mode
mémoire du TP 5 a disparu au TP 7 : les comptes n'existent qu'en base, et toute requête sur les
ruches suppose un jeton d'accès.

## Conventions

- Base : `http://localhost:3000`, préfixe `/api`, **pas de version** dans le chemin.
- Corps et réponses en JSON UTF-8 (`Content-Type: application/json`).
- Les identifiants sont des chaînes : `SN-CASA-001` (ruche), UUID (inspection).
- Ressources au pluriel, jamais de verbe dans le chemin.
- Les paramètres de chemin et de requête arrivent en chaîne ; les nombres sont validés côté serveur.

## Authentification

`POST /api/auth/login` avec `{ "email", "password" }` renvoie une paire de jetons
(`token_type`, `access_token`, `refresh_token`) ; `POST /api/auth/refresh` en renvoie une neuve à
partir de `{ "refresh_token" }`. `POST /api/auth/register` est réservé à l'administrateur et
`GET /api/auth/me` renvoie l'utilisateur du jeton.

Toutes les routes `/api/hives` exigent l'en-tête `Authorization: Bearer <access_token>`. Un 401
porte l'en-tête `WWW-Authenticate: Bearer realm="queenbee"`.

| Rôle | Ruches visibles | Peut envoyer |
| --- | --- | --- |
| `admin` | toutes | des mesures (il simule la passerelle), des comptes |
| `gestionnaire` | toutes | rien |
| `coordinateur` | celles de son site | des inspections |
| `apiculteur` | les siennes (`owner_id`) | des inspections |

Une ruche inexistante renvoie 404 ; une ruche existante mais hors de vos droits renvoie 403.

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
| 400 | `Données invalides` | corps ou paramètres refusés par un schéma Joi |
| 400 | `Données invalides` | corps annoncé JSON mais illisible |
| 401 | `Authentification requise` | jeton absent, invalide, expiré, ou identifiants refusés |
| 403 | `Accès refusé` | ruche ou site hors de vos droits, ou rôle insuffisant |
| 404 | `Ressource introuvable` | ruche inconnue |
| 404 | `Route inconnue` | verbe ou chemin inexistant |
| 409 | `Conflit` | la ressource existe déjà (clé primaire ou contrainte d'unicité) |
| 413 | `Contenu trop volumineux` | corps de plus de 1 Mo |
| 500 | `Erreur interne` | erreur inattendue du serveur |

Une erreur ne contient **jamais** de trace de pile, de message PostgreSQL ni de requête SQL : le détail
technique reste dans les journaux du serveur.

### Validation

Les corps et les paramètres de requête sont validés par **Joi** avant d'atteindre les services
(`src/validators/schemas.js`, intergiciel `validate`). Trois conséquences pour le client :

- toutes les erreurs sont renvoyées **d'un coup**, séparées par un retour à la ligne dans `detail` ;
- un champ non déclaré par le schéma est refusé (`author_id n'est pas un champ autorisé.`) ;
- les messages sont en français et nomment le champ fautif (`weight_kg est obligatoire.`).

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
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
]
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
  "title": "Données invalides",
  "status": 400,
  "detail": "limit doit être supérieur ou égal à 1."
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
- `weight_kg` : nombre strictement positif, au plus 150 kg (poids physique d'une ruche). Obligatoire.

**201**

```json
{ "hive_id": "SN-CASA-001", "timestamp": "2026-10-31T12:00:00.000Z", "weight_kg": 36.84, "site_id": "SN-CASA" }
```

**400** — corps incomplet : les deux manques sont signalés ensemble.

```json
{
  "type": "about:blank",
  "title": "Données invalides",
  "status": 400,
  "detail": "timestamp est obligatoire.\nweight_kg est obligatoire."
}
```

**409** — cette mesure existe déjà à cet horodatage pour cette ruche (clé primaire
`(hive_id, measured_at)`).

```json
{
  "type": "about:blank",
  "title": "Conflit",
  "status": 409,
  "detail": "Cette ressource existe déjà."
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
- `inspected_at` : date ISO 8601, obligatoire, **jamais dans le futur**.
- `queen_present` : booléen ou `null`, facultatif.
- `colony_status` : `forte`, `normale`, `faible` ou `morte`, obligatoire.
- `observations` : texte libre de 2 000 caractères au plus, facultatif (`""` par défaut).

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

**400** — champ manquant, invalide ou inconnu ; tous les problèmes sont listés dans `detail`.

```json
{
  "type": "about:blank",
  "title": "Données invalides",
  "status": 400,
  "detail": "id doit être un UUID.\nauthor_id n'est pas un champ autorisé."
}
```

**409** — cet UUID d'inspection est déjà enregistré.

**404** — ruche inconnue.
