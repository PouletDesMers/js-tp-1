// Repository PostgreSQL : où et comment sont les mesures. Il ne choisit aucun code HTTP.
// Les colonnes ne portent pas les noms de l'API : les alias rendent au service le format
// de la version en mémoire (measured_at → timestamp), et site_id vient d'une jointure.

export function createMeasuresRepository(pool) {
  // Relit une mesure au format de l'API : la même requête que findByHive, filtrée sur l'instant.
  async function findOne(hiveId, timestamp) {
    const { rows } = await pool.query(
      `SELECT m.hive_id, h.site_id, m.measured_at AS timestamp,
              m.lat AS position_lat, m.lon AS position_lon,
              m.weight_kg, m.temp_internal_c, m.temp_external_c, m.humidity_pct,
              m.acoustic_activity_score, m.battery_pct
         FROM measures m
         JOIN hives h ON h.id = m.hive_id
        WHERE m.hive_id = $1 AND m.measured_at = $2`,
      [hiveId, timestamp],
    );
    return rows[0] ?? null;
  }

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

    // Rejouer la même trame ne crée pas de doublon : la clé primaire (hive_id, measured_at)
    // fait foi, et ON CONFLICT DO NOTHING ignore la ligne au lieu de lever une erreur.
    async add(measure) {
      const { rowCount } = await pool.query(
        `INSERT INTO measures (hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
                               humidity_pct, acoustic_activity_score, battery_pct, lat, lon)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (hive_id, measured_at) DO NOTHING`,
        [
          measure.hive_id,
          measure.timestamp,
          measure.weight_kg,
          measure.temp_internal_c,
          measure.temp_external_c,
          measure.humidity_pct,
          measure.acoustic_activity_score,
          measure.battery_pct,
          measure.position_lat, // colonne lat
          measure.position_lon, // colonne lon
        ],
      );
      // rowCount vaut 1 si la ligne a été insérée, 0 si elle existait déjà.
      return { measure: await findOne(measure.hive_id, measure.timestamp), created: rowCount === 1 };
    },
  };
}
