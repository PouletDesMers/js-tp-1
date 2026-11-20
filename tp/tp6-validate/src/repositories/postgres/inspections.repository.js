// Repository PostgreSQL : où et comment sont les inspections. Il ne choisit aucun code HTTP.

export function createInspectionsRepository(pool) {
  return {
    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT id, hive_id, inspected_at, queen_present, colony_status, observations
           FROM inspections
          WHERE hive_id = $1
          ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },

    async add(inspection) {
      // author_id est obligatoire en base, mais l'authentification n'arrive qu'au TP 7 :
      // en attendant, l'auteur est le propriétaire de la ruche ($2 est le hive_id).
      const { rows } = await pool.query(
        `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present, colony_status, observations)
              VALUES ($1, $2, (SELECT owner_id FROM hives WHERE id = $2), $3, $4, $5, $6)
           RETURNING id, hive_id, inspected_at, queen_present, colony_status, observations`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.inspected_at,
          inspection.queen_present,
          inspection.colony_status,
          inspection.observations,
        ],
      );
      return rows[0];
    },
  };
}
