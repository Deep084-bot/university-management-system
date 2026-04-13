const { query } = require('../config/db');

async function listEligibleOffers(studentId) {
  const result = await query(
    `
      WITH student_profile AS (
        SELECT
          s.user_id,
          (s.admission_year + p.duration_years) AS graduating_batch,
          COALESCE(
            (SELECT graduating_cpi FROM final_outcome WHERE student_id = $1),
            (SELECT ROUND(AVG(spi), 2) FROM semester_result WHERE student_id = $1),
            s.curr_cpi,
            0
          ) AS cpi
        FROM student s
        JOIN program p ON p.program_id = s.program_id
        WHERE s.user_id = $1
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
        po.eligible_grad_batch_from,
        po.eligible_grad_batch_to,
        po.application_deadline,
        sp.cpi AS student_cpi,
        sp.graduating_batch AS student_graduating_batch,
        a.status AS application_status
      FROM placement_offer po
      JOIN company c ON c.company_id = po.company_id
      CROSS JOIN student_profile sp
      LEFT JOIN application a ON a.offer_id = po.offer_id AND a.student_id = $1
      WHERE po.eligible_min_cpi <= sp.cpi
        AND (po.eligible_grad_batch_from IS NULL OR sp.graduating_batch >= po.eligible_grad_batch_from)
        AND (po.eligible_grad_batch_to IS NULL OR sp.graduating_batch <= po.eligible_grad_batch_to)
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
