// Règles de validation des corps de requête : elles appartiennent au service.

const COLONY_STATUS = ["forte", "normale", "faible", "morte"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const estDateIso = (valeur) => typeof valeur === "string" && DATE_ISO.test(valeur) && !Number.isNaN(Date.parse(valeur));

// Renvoie un message de détail, ou null si le corps est valide.
export function validerMesure(corps) {
  const { timestamp, weight_kg } = corps;
  if (!estDateIso(timestamp) || typeof weight_kg !== "number" || !Number.isFinite(weight_kg)) {
    return "timestamp (date ISO 8601) et weight_kg (nombre) sont obligatoires.";
  }
  return null;
}

export function validerInspection(corps) {
  const { id, inspected_at, queen_present, colony_status, observations } = corps;
  const erreurs = [];
  if (typeof id !== "string" || !UUID.test(id)) erreurs.push("id doit être un UUID");
  if (!estDateIso(inspected_at)) erreurs.push("inspected_at doit être une date ISO 8601");
  if (typeof queen_present !== "boolean") erreurs.push("queen_present doit être un booléen");
  if (!COLONY_STATUS.includes(colony_status)) erreurs.push(`colony_status doit valoir ${COLONY_STATUS.join(", ")}`);
  if (observations !== undefined && typeof observations !== "string") erreurs.push("observations doit être un texte");
  return erreurs.length > 0 ? erreurs.join(" ; ") : null;
}
