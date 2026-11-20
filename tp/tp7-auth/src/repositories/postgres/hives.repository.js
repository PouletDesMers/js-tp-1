// Repository PostgreSQL : où et comment sont les données. Il ne choisit aucun code HTTP.
// Un filtre absent vaut null, et « $1::text IS NULL OR … » l'ignore : une seule requête
// fixe, jamais de SQL construit à la volée.

export function createHivesRepository(pool) {
  return {
    async findAll({ site_id = null, owner_id = null } = {}) {
      const { rows } = await pool.query(
        `SELECT id, site_id, owner_id, ref_lat, ref_lon, status
           FROM hives
          WHERE ($1::text IS NULL OR site_id = $1)
            AND ($2::uuid IS NULL OR owner_id = $2)
          ORDER BY id`,
        [site_id, owner_id],
      );
      return rows;
    },

    // owner_id est renvoyé : c'est lui qui décide si un apiculteur voit la ruche.
    async findById(id) {
      const { rows } = await pool.query(
        `SELECT id, site_id, owner_id, ref_lat, ref_lon, status FROM hives WHERE id = $1`,
        [id],
      );
      return rows[0] ?? null; // aucune ligne : null, comme la version en mémoire
    },
  };
}
