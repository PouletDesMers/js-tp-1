// Service : la règle métier est-elle respectée ? Il ne lit jamais req ni n'écrit res.
// Deux idées portent ce service : l'idempotence (l'UUID du client fait foi) et la version
// (une modification n'est acceptée que si l'appareil connaît la version du serveur).

import { AppError, ConflictError, ValidationError } from "../errors.js";

const plusRecentEnPremier = (a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at);

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  // L'auteur vient du jeton, jamais du corps.
  function toInspection(user, hive, data) {
    return {
      id: data.id,
      hive_id: hive.id,
      author_id: user.id,
      inspected_at: data.inspected_at,
      colony_status: data.colony_status,
      queen_present: data.queen_present ?? null,
      observations: data.observations ?? null,
    };
  }

  // Traite UNE inspection du lot, sans jamais lever d'erreur métier.
  async function syncOne(user, item) {
    try {
      const hive = await hivesService.getHive(user, item.hive_id);
      const inspection = toInspection(user, hive, item);

      if (item.version === undefined) {
        // Nouvelle inspection, saisie hors connexion.
        const { inspection: stored, created } = await inspectionsRepository.insertIfAbsent(inspection);
        if (created) return { id: item.id, status: "created", version: stored.version };
        if (stored.hive_id !== hive.id) {
          return {
            id: item.id,
            status: "rejected",
            detail: "Cet identifiant est déjà utilisé par une inspection d'une autre ruche.",
          };
        }
        return { id: item.id, status: "unchanged", version: stored.version };
      }

      // Une version : modification. Règle retenue : le serveur l'emporte.
      const updated = await inspectionsRepository.updateIfVersion(inspection, item.version);
      if (updated) return { id: item.id, status: "updated", version: updated.version };

      const current = await inspectionsRepository.findById(item.id);
      if (!current || current.hive_id !== hive.id) {
        return {
          id: item.id,
          status: "rejected",
          detail: "Inspection inconnue pour cette ruche : envoyez-la sans version pour la créer.",
        };
      }
      return {
        id: item.id,
        status: "conflict",
        detail: `L'inspection a été modifiée entre-temps : version ${current.version} sur le serveur, ${item.version} sur l'appareil.`,
        current,
      };
    } catch (err) {
      if (err instanceof AppError) return { id: item.id, status: "rejected", detail: err.message };
      throw err; // toute autre erreur est un bug
    }
  }

  return {
    async listInspections(user, hiveId) {
      const hive = await hivesService.getHive(user, hiveId);
      const items = await inspectionsRepository.findByHive(hive.id);
      return { items: items.sort(plusRecentEnPremier) };
    },

    // Rejouer la même inspection renvoie la ligne déjà en base, avec created: false.
    async addInspection(user, hiveId, corps = {}) {
      const hive = await hivesService.getHive(user, hiveId);
      if (corps.hive_id !== undefined && corps.hive_id !== hive.id) {
        throw new ValidationError(
          `Le corps désigne la ruche ${corps.hive_id}, alors que le chemin désigne ${hive.id}.`,
        );
      }
      const result = await inspectionsRepository.insertIfAbsent(toInspection(user, hive, corps));
      if (!result.created && result.inspection.hive_id !== hive.id) {
        throw new ConflictError(
          `L'identifiant ${corps.id} est déjà utilisé par une inspection d'une autre ruche.`,
        );
      }
      return result; // { inspection, created }
    },

    async syncInspections(user, items) {
      const results = [];
      for (const item of items) {
        results.push(await syncOne(user, item)); // une par une : un refus n'arrête pas le lot
      }
      const summary = { created: 0, unchanged: 0, updated: 0, conflict: 0, rejected: 0 };
      for (const result of results) summary[result.status] += 1;
      return { summary, results };
    },
  };
}
