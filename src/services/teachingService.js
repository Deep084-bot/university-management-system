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

      // Get offering details (course and academic year)
      const offeringResult = await client.query(
        `
          SELECT co.academic_year, c.credits, c.semester_no
          FROM course_offering co
          JOIN course c ON c.course_id = co.course_id
          WHERE co.offering_id = $1
        `,
        [offeringId]
      );

      if (offeringResult.rowCount === 0) {
        throw new ServiceError('Offering not found.', 404);
      }

      const { academic_year: academicYear, credits, semester_no: semesterNo } = offeringResult.rows[0];
      const publishedStudents = [];

      for (const [enrollmentId, gradeLetter] of Object.entries(gradesByEnrollment)) {
        if (!gradeLetter) {
          continue;
        }

        const enrollmentResult = await client.query(
          `
            SELECT e.enrollment_type, e.student_id
            FROM enrollment e
            WHERE e.enrollment_id = $1
              AND e.offering_id = $2
            FOR UPDATE
          `,
          [enrollmentId, offeringId]
        );

        if (enrollmentResult.rowCount === 0) {
          throw new ServiceError(`Enrollment ${enrollmentId} does not belong to the selected offering.`);
        }

        const { enrollment_type: enrollmentType, student_id: studentId } = enrollmentResult.rows[0];
        const isCountedForCpi = enrollmentType === 'Credit';

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

        publishedStudents.push({ studentId, semesterNo, academicYear, credits, isCountedForCpi });
      }

      // Calculate SPI for each affected student
      for (const { studentId, semesterNo, academicYear, credits, isCountedForCpi } of publishedStudents) {
        await calculateAndStoreSPI(client, studentId, semesterNo, academicYear, credits, isCountedForCpi);
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      throw new ServiceError('One of the supplied grade letters does not exist in the grade scale.');
    }

    throw error;
  }
}

async function calculateAndStoreSPI(client, studentId, semesterNo, academicYear, credits, isCountedForCpi) {
  // For each student, calculate semester SPI based on enrolled courses in that semester
  const spiResult = await client.query(
    `
      SELECT
        ROUND(
          COALESCE(
            SUM(CASE WHEN g.is_counted_for_cpi THEN gs.grade_point * c.credits ELSE 0 END)
            / NULLIF(SUM(CASE WHEN g.is_counted_for_cpi THEN c.credits ELSE 0 END), 0),
            0
          ),
          2
        ) AS spi,
        COALESCE(SUM(c.credits), 0) AS total_credits
      FROM enrollment e
      JOIN course_offering co ON co.offering_id = e.offering_id
      JOIN course c ON c.course_id = co.course_id
      JOIN grade g ON g.enrollment_id = e.enrollment_id
      JOIN grade_scale gs ON gs.grade_letter = g.grade_letter
      WHERE e.student_id = $1
        AND co.academic_year = $2
        AND c.semester_no = $3
    `,
    [studentId, academicYear, semesterNo]
  );

  if (spiResult.rowCount > 0 && spiResult.rows[0].spi !== null && spiResult.rows[0].total_credits > 0) {
    const { spi, total_credits: creditsEarned } = spiResult.rows[0];

    // Insert or update semester_result (idempotent)
    await client.query(
      `
        INSERT INTO semester_result (student_id, academic_year, semester_no, spi, credits_earned_sem)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, academic_year, semester_no)
        DO UPDATE
        SET spi = EXCLUDED.spi,
            credits_earned_sem = EXCLUDED.credits_earned_sem
      `,
      [studentId, academicYear, semesterNo, spi, creditsEarned]
    );
  }
}

async function finalizeSemesterMarks(facultyId, offeringId, marksByEnrollment) {
  try {
    return await withTransaction(async (client) => {
      await verifyFacultyOffering(client, facultyId, offeringId);

      // Get offering details for grade mapping
      const offeringResult = await client.query(
        `
          SELECT co.academic_year, c.credits, c.semester_no
          FROM course_offering co
          JOIN course c ON c.course_id = co.course_id
          WHERE co.offering_id = $1
        `,
        [offeringId]
      );

      if (offeringResult.rowCount === 0) {
        throw new ServiceError('Offering not found.', 404);
      }

      const { academic_year: academicYear, credits, semester_no: semesterNo } = offeringResult.rows[0];
      const publishedStudents = [];

      // Get all students and their marks for relative grading
      const marksToProcess = Object.entries(marksByEnrollment)
        .filter(([, mark]) => mark && !isNaN(parseFloat(mark)))
        .map(([enrollmentId, mark]) => ({
          enrollmentId: Number(enrollmentId),
          mark: parseFloat(mark)
        }));

      // Sort by marks descending to assign grades based on relative performance
      marksToProcess.sort((a, b) => b.mark - a.mark);

      for (let idx = 0; idx < marksToProcess.length; idx += 1) {
        const { enrollmentId, mark } = marksToProcess[idx];
        const totalStudents = marksToProcess.length;
        const percentile = idx / totalStudents;

        // Map percentile to grade
        let gradeLetter = 'F';
        if (percentile <= 0.10) {
          gradeLetter = 'A+';
        } else if (percentile <= 0.25) {
          gradeLetter = 'A';
        } else if (percentile <= 0.45) {
          gradeLetter = 'B+';
        } else if (percentile <= 0.65) {
          gradeLetter = 'B';
        } else if (percentile <= 0.80) {
          gradeLetter = 'C';
        } else if (percentile <= 0.90) {
          gradeLetter = 'D';
        }

        const enrollmentResult = await client.query(
          `
            SELECT e.enrollment_type, e.student_id
            FROM enrollment e
            WHERE e.enrollment_id = $1
              AND e.offering_id = $2
            FOR UPDATE
          `,
          [enrollmentId, offeringId]
        );

        if (enrollmentResult.rowCount === 0) {
          throw new ServiceError(`Enrollment ${enrollmentId} does not belong to the selected offering.`);
        }

        const { enrollment_type: enrollmentType, student_id: studentId } = enrollmentResult.rows[0];
        const isCountedForCpi = enrollmentType === 'Credit';

        // Publish grade
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

        publishedStudents.push({ studentId, semesterNo, academicYear, credits, isCountedForCpi });
      }

      // Calculate SPI for each student
      for (const { studentId, semesterNo, academicYear, credits, isCountedForCpi } of publishedStudents) {
        await calculateAndStoreSPI(client, studentId, semesterNo, academicYear, credits, isCountedForCpi);
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      throw new ServiceError('One of the supplied grades does not exist in the grade scale.');
    }

    throw error;
  }
}

module.exports = {
  markAttendance,
  addAssessmentComponent,
  upsertMarks,
  publishGrades,
  finalizeSemesterMarks
};
