const { withTransaction } = require('../config/db');
const ServiceError = require('./serviceError');

async function applyToOffer(studentId, offerId) {
  try {
    return await withTransaction(async (client) => {
      const studentResult = await client.query(
        `
          SELECT user_id
          FROM student
          WHERE user_id = $1
          FOR UPDATE
        `,
        [studentId]
      );

      if (studentResult.rowCount === 0) {
        throw new ServiceError('Student record not found.', 404);
      }

      const studentProfileResult = await client.query(
        `
          SELECT
            (s.admission_year + p.duration_years) AS graduating_batch,
            COALESCE(
              (SELECT graduating_cpi FROM final_outcome WHERE student_id = $1),
              (SELECT ROUND(AVG(spi), 2) FROM semester_result WHERE student_id = $1),
              s.curr_cpi,
              0
            ) AS current_cpi
          FROM student s
          JOIN program p ON p.program_id = s.program_id
          WHERE s.user_id = $1
        `,
        [studentId]
      );

      const currentCpi = Number(studentProfileResult.rows[0].current_cpi);
      const graduatingBatch = Number(studentProfileResult.rows[0].graduating_batch);

      const offerResult = await client.query(
        `
          SELECT
            offer_id,
            eligible_min_cpi,
            eligible_grad_batch_from,
            eligible_grad_batch_to,
            application_deadline
          FROM placement_offer
          WHERE offer_id = $1
          FOR UPDATE
        `,
        [offerId]
      );

      const offer = offerResult.rows[0];
      if (!offer) {
        throw new ServiceError('Placement offer not found.', 404);
      }

      if (offer.application_deadline && new Date(offer.application_deadline) < new Date()) {
        throw new ServiceError('The application deadline for this role has passed.');
      }

      if (currentCpi < Number(offer.eligible_min_cpi)) {
        throw new ServiceError('Your CPI does not meet the eligibility threshold for this role.', 403);
      }

      if (offer.eligible_grad_batch_from && graduatingBatch < Number(offer.eligible_grad_batch_from)) {
        throw new ServiceError('Your graduating batch is not eligible for this placement offer.', 403);
      }

      if (offer.eligible_grad_batch_to && graduatingBatch > Number(offer.eligible_grad_batch_to)) {
        throw new ServiceError('Your graduating batch is not eligible for this placement offer.', 403);
      }

      const insertResult = await client.query(
        `
          INSERT INTO application (student_id, offer_id, status)
          VALUES ($1, $2, 'Applied')
          RETURNING application_id
        `,
        [studentId, offerId]
      );

      return insertResult.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('You have already applied to this placement offer.');
    }

    throw error;
  }
}

module.exports = {
  applyToOffer
};
