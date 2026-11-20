// Repository PostgreSQL : où et comment sont les inspections. Il ne choisit aucun code HTTP.

export function createInspectionsRepository(pool) {
  return {
    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT id, hive_id, author_id, inspected_at, queen_present, colony_status, observations
           FROM inspections
          WHERE hive_id = $1
          ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },

    async add(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present, colony_status, observations)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, hive_id, author_id, inspected_at, queen_present, colony_status, observations`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.author_id,
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
