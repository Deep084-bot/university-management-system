const env = require('../config/env');
const { withTransaction } = require('../config/db');
const ServiceError = require('./serviceError');

async function registerStudent(studentId, offeringId, enrollmentType = 'Credit') {
  try {
    return await withTransaction(async (client) => {
      const studentResult = await client.query(
        `
          SELECT user_id, program_id, current_semester
          FROM student
          WHERE user_id = $1
          FOR UPDATE
        `,
        [studentId]
      );

      const student = studentResult.rows[0];
      if (!student) {
        throw new ServiceError('Student record not found.', 404);
      }

      const offeringResult = await client.query(
        `
          SELECT
            co.offering_id,
            co.academic_year,
            c.course_id,
            c.course_name,
            c.program_id,
            c.semester_no
          FROM course_offering co
          JOIN course c ON c.course_id = co.course_id
          WHERE co.offering_id = $1
          FOR UPDATE
        `,
        [offeringId]
      );

      const offering = offeringResult.rows[0];
      if (!offering) {
        throw new ServiceError('Course offering not found.', 404);
      }

      if (offering.academic_year !== env.currentAcademicYear) {
        throw new ServiceError('Registration is only open for the active academic year.');
      }

      if (student.program_id !== offering.program_id) {
        throw new ServiceError('You cannot register for a course outside your program.');
      }

      if (student.current_semester !== offering.semester_no) {
        throw new ServiceError('This offering is not mapped to your current semester.');
      }

      const duplicateEnrollment = await client.query(
        `
          SELECT 1
          FROM enrollment
          WHERE student_id = $1
            AND offering_id = $2
          FOR UPDATE
        `,
        [studentId, offeringId]
      );

      if (duplicateEnrollment.rowCount > 0) {
        throw new ServiceError('You are already enrolled in this course offering.');
      }

      const unmetPrerequisites = await client.query(
        `
          SELECT p.prereq_id, p.min_grade_req
          FROM prerequisite p
          JOIN grade_scale required_grade ON required_grade.grade_letter = p.min_grade_req
          WHERE p.course_id = $1
            AND NOT EXISTS (
              SELECT 1
              FROM enrollment completed_enrollment
              JOIN course_offering completed_offering ON completed_offering.offering_id = completed_enrollment.offering_id
              JOIN grade g ON g.enrollment_id = completed_enrollment.enrollment_id
              JOIN grade_scale actual_grade ON actual_grade.grade_letter = g.grade_letter
              WHERE completed_enrollment.student_id = $2
                AND completed_offering.course_id = p.prereq_id
                AND actual_grade.grade_point >= required_grade.grade_point
            )
        `,
        [offering.course_id, studentId]
      );

      if (unmetPrerequisites.rowCount > 0) {
        const missingCourses = unmetPrerequisites.rows
          .map((row) => `${row.prereq_id} (${row.min_grade_req})`)
          .join(', ');
        throw new ServiceError(`Prerequisites not satisfied: ${missingCourses}.`);
      }

      const attemptResult = await client.query(
        `
          SELECT COALESCE(MAX(e.attempt_no), 0) + 1 AS next_attempt
          FROM enrollment e
          JOIN course_offering historic_offering ON historic_offering.offering_id = e.offering_id
          WHERE e.student_id = $1
            AND historic_offering.course_id = $2
        `,
        [studentId, offering.course_id]
      );

      const nextAttempt = Number(attemptResult.rows[0].next_attempt);

      const insertResult = await client.query(
        `
          INSERT INTO enrollment (
            student_id,
            offering_id,
            enrollment_type,
            attempt_no,
            academic_year,
            semester_no
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING enrollment_id
        `,
        [studentId, offeringId, enrollmentType, nextAttempt, offering.academic_year, offering.semester_no]
      );

      return {
        enrollmentId: insertResult.rows[0].enrollment_id,
        courseName: offering.course_name
      };
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('You are already enrolled in this offering.');
    }

    throw error;
  }
}

module.exports = {
  registerStudent
};
