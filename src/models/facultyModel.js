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
        day_attendance.status AS attendance_status,
        ROUND(
          COALESCE(
            100.0 * SUM(CASE WHEN history.status = 'Present' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(history.attendance_date), 0),
            0
          ),
          2
        ) AS attendance_percentage,
        g.grade_letter,
        ROUND(
          COALESCE(
            NULLIF(SUM(CASE WHEN credits_earned_sem > 0 THEN sr.spi * sr.credits_earned_sem ELSE 0 END)
            / NULLIF(SUM(CASE WHEN credits_earned_sem > 0 THEN sr.credits_earned_sem ELSE 0 END), 0), 0),
            0
          ),
          2
        ) AS student_cpi,
        COALESCE((
          SELECT spi FROM semester_result
          WHERE student_id = s.user_id
          ORDER BY academic_year DESC, semester_no DESC
          LIMIT 1
        ), 0) AS latest_spi
      FROM teaches t
      JOIN enrollment e ON e.offering_id = t.offering_id
      JOIN student s ON s.user_id = e.student_id
      JOIN app_user u ON u.user_id = s.user_id
      LEFT JOIN attendance history ON history.enrollment_id = e.enrollment_id
      LEFT JOIN attendance day_attendance
        ON day_attendance.enrollment_id = e.enrollment_id
        AND day_attendance.attendance_date = COALESCE($3::date, CURRENT_DATE)
      LEFT JOIN grade g ON g.enrollment_id = e.enrollment_id
      LEFT JOIN semester_result sr ON sr.student_id = s.user_id
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

async function getGradebook(facultyId, offeringId) {
  const result = await query(
    `
      WITH offering_component_counts AS (
        SELECT offering_id, COUNT(*) AS total_components
        FROM assessment_component
        WHERE offering_id = $2
        GROUP BY offering_id
      ),
      grade_totals AS (
        SELECT
          e.enrollment_id,
          s.roll_number,
          u.name,
          e.enrollment_type,
          g.grade_letter AS published_grade,
          ROUND(COALESCE(SUM(sm.weighted_marks), 0), 2) AS total_weighted_marks,
          COUNT(sm.component_id) AS assessed_components,
          COALESCE(occ.total_components, 0) AS total_components,
          COUNT(*) OVER () AS total_students
        FROM teaches t
        JOIN enrollment e ON e.offering_id = t.offering_id
        JOIN student s ON s.user_id = e.student_id
        JOIN app_user u ON u.user_id = s.user_id
        LEFT JOIN student_marks sm ON sm.enrollment_id = e.enrollment_id
        LEFT JOIN grade g ON g.enrollment_id = e.enrollment_id
        LEFT JOIN offering_component_counts occ ON occ.offering_id = e.offering_id
        WHERE t.faculty_id = $1
          AND t.offering_id = $2
        GROUP BY e.enrollment_id, s.roll_number, u.name, e.enrollment_type, g.grade_letter, occ.total_components
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (ORDER BY total_weighted_marks DESC, roll_number ASC) AS rank_position,
          CASE
            WHEN total_students = 1 THEN 1.0
            ELSE CUME_DIST() OVER (ORDER BY total_weighted_marks DESC, roll_number ASC)
          END AS percentile_rank
        FROM grade_totals
      )
      SELECT
        *,
        CASE
          WHEN total_students = 1 THEN 'A+'
          WHEN percentile_rank <= 0.10 THEN 'A+'
          WHEN percentile_rank <= 0.25 THEN 'A'
          WHEN percentile_rank <= 0.45 THEN 'B+'
          WHEN percentile_rank <= 0.65 THEN 'B'
          WHEN percentile_rank <= 0.80 THEN 'C'
          WHEN percentile_rank <= 0.90 THEN 'D'
          ELSE 'F'
        END AS suggested_grade
      FROM ranked
      ORDER BY rank_position
    `,
    [facultyId, offeringId]
  );

  return result.rows;
}

async function getStudentAllSemesters(facultyId, studentId) {
  const result = await query(
    `
      SELECT
        s.current_semester,
        s.user_id AS student_id,
        u.name,
        s.roll_number,
        ROUND(
          COALESCE(
            NULLIF(SUM(CASE WHEN credits_earned_sem > 0 THEN sr.spi * sr.credits_earned_sem ELSE 0 END)
            / NULLIF(SUM(CASE WHEN credits_earned_sem > 0 THEN sr.credits_earned_sem ELSE 0 END), 0), 0),
            0
          ),
          2
        ) AS student_cpi
      FROM student s
      JOIN app_user u ON u.user_id = s.user_id
      LEFT JOIN semester_result sr ON sr.student_id = s.user_id
      WHERE s.user_id = $1
      GROUP BY s.user_id, u.name, s.roll_number, s.current_semester
    `,
    [studentId]
  );

  if (result.rows.length === 0) {
    return { semesters: [], studentInfo: {} };
  }

  const studentInfo = result.rows[0];
  const { current_semester: currentSemester } = studentInfo;

  // Get all semester results
  const spiResult = await query(
    `
      SELECT academic_year, semester_no, spi, credits_earned_sem
      FROM semester_result
      WHERE student_id = $1
      ORDER BY semester_no ASC
    `,
    [studentId]
  );

  const semesterMap = Object.fromEntries(
    spiResult.rows.map((row) => [row.semester_no, row])
  );

  // Build semesters array 1 to current
  const semesters = [];
  for (let sem = 1; sem <= currentSemester; sem += 1) {
    semesters.push(
      semesterMap[sem] || {
        semester_no: sem,
        academic_year: null,
        spi: 0,
        credits_earned_sem: 0
      }
    );
  }

  return { semesters, studentInfo };
}

module.exports = {
  getFacultyProfile,
  listTeachingOfferings,
  getOfferingRoster,
  listAssessmentComponents,
  getComponentMarks,
  getGradebook,
  getStudentAllSemesters
};
