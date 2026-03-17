const { query } = require('../config/db');

async function listEligibleOffers(studentId) {
  const result = await query(
    `
      WITH student_cpi AS (
        SELECT COALESCE(
          (SELECT graduating_cpi FROM final_outcome WHERE student_id = $1),
          (SELECT ROUND(AVG(spi), 2) FROM semester_result WHERE student_id = $1),
          0
        ) AS cpi
      )
      SELECT
        po.offer_id,
        c.company_name,
        c.industry_type,
        po.role_name,
        po.package_ctc,
        po.offer_type,
        po.location,
        po.eligible_min_cpi,
        po.application_deadline,
        sc.cpi AS student_cpi,
        a.status AS application_status
      FROM placement_offer po
      JOIN company c ON c.company_id = po.company_id
      CROSS JOIN student_cpi sc
      LEFT JOIN application a ON a.offer_id = po.offer_id AND a.student_id = $1
      WHERE po.eligible_min_cpi <= sc.cpi
        AND (po.application_deadline IS NULL OR po.application_deadline >= CURRENT_DATE)
      ORDER BY po.application_deadline NULLS LAST, po.package_ctc DESC, c.company_name
    `,
    [studentId]
  );

  return result.rows;
}

async function listApplications(studentId) {
  const result = await query(
    `
      SELECT
        a.application_id,
        a.status,
        a.applied_at,
        c.company_name,
        po.role_name,
        po.offer_type,
        po.package_ctc
      FROM application a
      JOIN placement_offer po ON po.offer_id = a.offer_id
      JOIN company c ON c.company_id = po.company_id
      WHERE a.student_id = $1
      ORDER BY a.applied_at DESC
    `,
    [studentId]
  );

  return result.rows;
}

module.exports = {
  listEligibleOffers,
  listApplications
};
