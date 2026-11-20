// Repository PostgreSQL : où et comment sont les mesures. Il ne choisit aucun code HTTP.
// Les colonnes ne portent pas les noms de l'API : les alias rendent au service le format
// de la version en mémoire (measured_at → timestamp), et site_id vient d'une jointure.

export function createMeasuresRepository(pool) {
  return {
    // LIMIT NULL ne limite pas : la pagination reste une règle du service.
    async findByHive(hiveId, { limit = null, offset = 0 } = {}) {
      const { rows } = await pool.query(
        `SELECT m.hive_id, m.measured_at AS timestamp, m.weight_kg, h.site_id
           FROM measures m
           JOIN hives h ON h.id = m.hive_id
          WHERE m.hive_id = $1
          ORDER BY m.measured_at DESC
          LIMIT $2 OFFSET $3`,
        [hiveId, limit, offset],
      );
      return rows;
    },

    async add(measure) {
      const { rows } = await pool.query(
        `INSERT INTO measures (hive_id, measured_at, weight_kg)
              VALUES ($1, $2, $3)
           RETURNING hive_id, measured_at AS timestamp, weight_kg,
                     (SELECT site_id FROM hives WHERE id = $1) AS site_id`,
        [measure.hive_id, measure.timestamp, measure.weight_kg],
      );
      return rows[0];
    },
  };
}
