const { query } = require('../config/db');

async function getStudentProfile(studentId) {
  const result = await query(
    `
      SELECT
        u.user_id,
        u.name,
        u.email,
        s.roll_number,
        s.admission_year,
        s.current_semester,
        p.program_id,
        p.degree,
        p.branch,
        d.department_name
      FROM student s
      JOIN app_user u ON u.user_id = s.user_id
      JOIN program p ON p.program_id = s.program_id
      JOIN department d ON d.department_id = p.department_id
      WHERE s.user_id = $1
    `,
    [studentId]
  );

  return result.rows[0] || null;
}

async function listCurrentEnrollments(studentId) {
  const result = await query(
    `
      SELECT
        e.enrollment_id,
        e.enrollment_type,
        e.attempt_no,
        e.academic_year,
        e.semester_no,
        c.course_id,
        c.course_name,
        c.credits,
        c.category,
        co.section,
        g.grade_letter,
        ROUND(COALESCE(SUM(sm.weighted_marks), 0), 2) AS weighted_total,
        STRING_AGG(DISTINCT faculty_user.name, ', ' ORDER BY faculty_user.name) AS faculty_names
      FROM enrollment e
      JOIN course_offering co ON co.offering_id = e.offering_id
      JOIN course c ON c.course_id = co.course_id
      LEFT JOIN grade g ON g.enrollment_id = e.enrollment_id
      LEFT JOIN student_marks sm ON sm.enrollment_id = e.enrollment_id
      LEFT JOIN teaches t ON t.offering_id = co.offering_id
      LEFT JOIN faculty faculty_member ON faculty_member.user_id = t.faculty_id
      LEFT JOIN app_user faculty_user ON faculty_user.user_id = faculty_member.user_id
      WHERE e.student_id = $1
      GROUP BY e.enrollment_id, c.course_id, c.course_name, c.credits, c.category, co.section, g.grade_letter
      ORDER BY e.academic_year DESC, e.semester_no DESC, c.course_id
    `,
    [studentId]
  );

  return result.rows;
}

async function listAvailableOfferings(studentId, academicYear) {
  const result = await query(
    `
      SELECT
        co.offering_id,
        co.academic_year,
        co.section,
        c.course_id,
        c.course_name,
        c.credits,
        c.category,
        c.min_attendance_req,
        c.semester_no,
        STRING_AGG(DISTINCT faculty_user.name, ', ' ORDER BY faculty_user.name) AS faculty_names
      FROM student s
      JOIN course c ON c.program_id = s.program_id AND c.semester_no = s.current_semester
      JOIN course_offering co ON co.course_id = c.course_id AND co.academic_year = $2
      LEFT JOIN teaches t ON t.offering_id = co.offering_id
      LEFT JOIN faculty faculty_member ON faculty_member.user_id = t.faculty_id
      LEFT JOIN app_user faculty_user ON faculty_user.user_id = faculty_member.user_id
      WHERE s.user_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM enrollment e
          WHERE e.student_id = s.user_id
            AND e.offering_id = co.offering_id
        )
      GROUP BY co.offering_id, co.academic_year, co.section, c.course_id, c.course_name, c.credits, c.category, c.min_attendance_req, c.semester_no
      ORDER BY c.course_id, co.section
    `,
    [studentId, academicYear]
  );

  return result.rows;
}

async function listSemesterResults(studentId) {
  const result = await query(
    `
      SELECT academic_year, semester_no, spi, credits_earned_sem
      FROM semester_result
      WHERE student_id = $1
      ORDER BY academic_year DESC, semester_no DESC
    `,
    [studentId]
  );

  return result.rows;
}

module.exports = {
  getStudentProfile,
  listCurrentEnrollments,
  listAvailableOfferings,
  listSemesterResults
};
