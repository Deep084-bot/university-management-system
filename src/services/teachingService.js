const { withTransaction } = require('../config/db');
const ServiceError = require('./serviceError');

async function verifyFacultyOffering(client, facultyId, offeringId) {
  const result = await client.query(
    `
      SELECT 1
      FROM teaches
      WHERE faculty_id = $1
        AND offering_id = $2
      FOR KEY SHARE
    `,
    [facultyId, offeringId]
  );

  if (result.rowCount === 0) {
    throw new ServiceError('You are not assigned to this course offering.', 403);
  }
}

async function markAttendance(facultyId, offeringId, attendanceDate, attendanceByEnrollment) {
  return withTransaction(async (client) => {
    await verifyFacultyOffering(client, facultyId, offeringId);

    for (const [enrollmentId, status] of Object.entries(attendanceByEnrollment)) {
      if (!status) {
        continue;
      }

      const enrollmentResult = await client.query(
        `
          SELECT 1
          FROM enrollment
          WHERE enrollment_id = $1
            AND offering_id = $2
          FOR UPDATE
        `,
        [enrollmentId, offeringId]
      );

      if (enrollmentResult.rowCount === 0) {
        throw new ServiceError(`Enrollment ${enrollmentId} does not belong to the selected offering.`);
      }

      await client.query(
        `
          INSERT INTO attendance (enrollment_id, attendance_date, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (enrollment_id, attendance_date)
          DO UPDATE SET status = EXCLUDED.status
        `,
        [enrollmentId, attendanceDate, status]
      );
    }
  });
}

async function addAssessmentComponent(facultyId, offeringId, type, weightage, maxMarks) {
  try {
    return await withTransaction(async (client) => {
      await verifyFacultyOffering(client, facultyId, offeringId);

      const result = await client.query(
        `
          INSERT INTO assessment_component (offering_id, type, weightage, max_marks)
          VALUES ($1, $2, $3, $4)
          RETURNING component_id
        `,
        [offeringId, type, weightage, maxMarks]
      );

      return result.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('An assessment component with that type already exists for the selected offering.');
    }

    throw error;
  }
}

async function upsertMarks(facultyId, offeringId, componentId, marksByEnrollment) {
  return withTransaction(async (client) => {
    await verifyFacultyOffering(client, facultyId, offeringId);

    const componentResult = await client.query(
      `
        SELECT component_id
        FROM assessment_component
        WHERE component_id = $1
          AND offering_id = $2
        FOR KEY SHARE
      `,
      [componentId, offeringId]
    );

    if (componentResult.rowCount === 0) {
      throw new ServiceError('Assessment component not found for the selected offering.', 404);
    }

    for (const [enrollmentId, marks] of Object.entries(marksByEnrollment)) {
      if (marks === '' || marks === null || marks === undefined) {
        continue;
      }

      const enrollmentResult = await client.query(
        `
          SELECT 1
          FROM enrollment
          WHERE enrollment_id = $1
            AND offering_id = $2
          FOR UPDATE
        `,
        [enrollmentId, offeringId]
      );

      if (enrollmentResult.rowCount === 0) {
        throw new ServiceError(`Enrollment ${enrollmentId} does not belong to the selected offering.`);
      }

      await client.query(
        `
          INSERT INTO student_marks (enrollment_id, component_id, marks_obtained, weighted_marks)
          VALUES ($1, $2, $3, 0)
          ON CONFLICT (enrollment_id, component_id)
          DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained
        `,
        [enrollmentId, componentId, marks]
      );
    }
  });
}

async function publishGrades(facultyId, offeringId, gradesByEnrollment) {
  try {
    return await withTransaction(async (client) => {
      await verifyFacultyOffering(client, facultyId, offeringId);

      for (const [enrollmentId, gradeLetter] of Object.entries(gradesByEnrollment)) {
        if (!gradeLetter) {
          continue;
        }

        const enrollmentResult = await client.query(
          `
            SELECT enrollment_type
            FROM enrollment
            WHERE enrollment_id = $1
              AND offering_id = $2
            FOR UPDATE
          `,
          [enrollmentId, offeringId]
        );

        if (enrollmentResult.rowCount === 0) {
          throw new ServiceError(`Enrollment ${enrollmentId} does not belong to the selected offering.`);
        }

        const isCountedForCpi = enrollmentResult.rows[0].enrollment_type === 'Credit';

        await client.query(
          `
            INSERT INTO grade (enrollment_id, grade_letter, is_counted_for_cpi)
            VALUES ($1, $2, $3)
            ON CONFLICT (enrollment_id)
            DO UPDATE
            SET grade_letter = EXCLUDED.grade_letter,
                is_counted_for_cpi = EXCLUDED.is_counted_for_cpi,
                published_at = CURRENT_TIMESTAMP
          `,
          [enrollmentId, gradeLetter, isCountedForCpi]
        );
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      throw new ServiceError('One of the supplied grade letters does not exist in the grade scale.');
    }

    throw error;
  }
}

module.exports = {
  markAttendance,
  addAssessmentComponent,
  upsertMarks,
  publishGrades
};
