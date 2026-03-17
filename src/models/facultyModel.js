const { query } = require('../config/db');

async function getFacultyProfile(facultyId) {
  const result = await query(
    `
      SELECT
        u.user_id,
        u.name,
        u.email,
        f.employee_code,
        f.designation,
        d.department_name
      FROM faculty f
      JOIN app_user u ON u.user_id = f.user_id
      JOIN department d ON d.department_id = f.department_id
      WHERE f.user_id = $1
    `,
    [facultyId]
  );

  return result.rows[0] || null;
}

async function listTeachingOfferings(facultyId, academicYear = null) {
  const params = [facultyId];
  let yearFilter = '';

  if (academicYear) {
    params.push(academicYear);
    yearFilter = 'AND co.academic_year = $2';
  }

  const result = await query(
    `
      SELECT
        co.offering_id,
        co.academic_year,
        co.section,
        c.course_id,
        c.course_name,
        c.credits,
        COUNT(DISTINCT e.enrollment_id) AS student_count
      FROM teaches t
      JOIN course_offering co ON co.offering_id = t.offering_id
      JOIN course c ON c.course_id = co.course_id
      LEFT JOIN enrollment e ON e.offering_id = co.offering_id
      WHERE t.faculty_id = $1
      ${yearFilter}
      GROUP BY co.offering_id, co.academic_year, co.section, c.course_id, c.course_name, c.credits
      ORDER BY co.academic_year DESC, c.course_id, co.section
    `,
    params
  );

  return result.rows;
}

async function getOfferingRoster(facultyId, offeringId, attendanceDate = null) {
  const result = await query(
    `
      SELECT
        e.enrollment_id,
        s.user_id AS student_id,
        u.name,
        s.roll_number,
        e.enrollment_type,
        COALESCE(day_attendance.status, 'Present') AS attendance_status,
        ROUND(
          COALESCE(
            100.0 * SUM(CASE WHEN history.status = 'Present' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(history.attendance_date), 0),
            0
          ),
          2
        ) AS attendance_percentage,
        g.grade_letter
      FROM teaches t
      JOIN enrollment e ON e.offering_id = t.offering_id
      JOIN student s ON s.user_id = e.student_id
      JOIN app_user u ON u.user_id = s.user_id
      LEFT JOIN attendance history ON history.enrollment_id = e.enrollment_id
      LEFT JOIN attendance day_attendance
        ON day_attendance.enrollment_id = e.enrollment_id
        AND day_attendance.attendance_date = COALESCE($3::date, CURRENT_DATE)
      LEFT JOIN grade g ON g.enrollment_id = e.enrollment_id
      WHERE t.faculty_id = $1
        AND t.offering_id = $2
      GROUP BY e.enrollment_id, s.user_id, u.name, s.roll_number, e.enrollment_type, day_attendance.status, g.grade_letter
      ORDER BY s.roll_number
    `,
    [facultyId, offeringId, attendanceDate]
  );

  return result.rows;
}

async function listAssessmentComponents(facultyId, offeringId) {
  const result = await query(
    `
      SELECT ac.component_id, ac.type, ac.weightage, ac.max_marks
      FROM teaches t
      JOIN assessment_component ac ON ac.offering_id = t.offering_id
      WHERE t.faculty_id = $1
        AND t.offering_id = $2
      ORDER BY ac.component_id
    `,
    [facultyId, offeringId]
  );

  return result.rows;
}

async function getComponentMarks(facultyId, offeringId, componentId) {
  const result = await query(
    `
      SELECT e.enrollment_id, sm.marks_obtained, sm.weighted_marks
      FROM teaches t
      JOIN enrollment e ON e.offering_id = t.offering_id
      LEFT JOIN student_marks sm
        ON sm.enrollment_id = e.enrollment_id
        AND sm.component_id = $3
      WHERE t.faculty_id = $1
        AND t.offering_id = $2
    `,
    [facultyId, offeringId, componentId]
  );

  return result.rows;
}

module.exports = {
  getFacultyProfile,
  listTeachingOfferings,
  getOfferingRoster,
  listAssessmentComponents,
  getComponentMarks
};
