const { query } = require('../config/db');

async function getAdminSnapshot() {
  const result = await query(
    `
      SELECT
        (SELECT COUNT(*) FROM student) AS student_count,
        (SELECT COUNT(*) FROM faculty) AS faculty_count,
        (SELECT COUNT(*) FROM course_offering) AS offering_count,
        (SELECT COUNT(*) FROM placement_offer) AS placement_offer_count,
        (SELECT COUNT(*) FROM application) AS application_count
    `
  );

  return result.rows[0];
}

async function listCompanies() {
  const result = await query(
    `
      SELECT company_id, company_name, contact, email, industry_type
      FROM company
      ORDER BY company_name
    `
  );

  return result.rows;
}

async function listPlacementOffers() {
  const result = await query(
    `
      SELECT
        po.offer_id,
        c.company_name,
        po.role_name,
        po.package_ctc,
        po.offer_type,
        po.location,
        po.eligible_min_cpi,
        po.application_deadline,
        COUNT(a.application_id) AS applicant_count
      FROM placement_offer po
      JOIN company c ON c.company_id = po.company_id
      LEFT JOIN application a ON a.offer_id = po.offer_id
      GROUP BY po.offer_id, c.company_name
      ORDER BY po.application_deadline NULLS LAST, c.company_name, po.role_name
    `
  );

  return result.rows;
}

async function listCourseCatalog() {
  const result = await query(
    `
      SELECT c.course_id, c.course_name, c.credits, c.semester_no, c.category, p.degree, p.branch
      FROM course c
      JOIN program p ON p.program_id = c.program_id
      ORDER BY c.course_id
    `
  );

  return result.rows;
}

async function listPrograms() {
  const result = await query(
    `
      SELECT
        p.program_id,
        p.degree,
        p.branch,
        d.department_name
      FROM program p
      JOIN department d ON d.department_id = p.department_id
      ORDER BY p.degree, p.branch
    `
  );

  return result.rows;
}

async function listDepartments() {
  const result = await query(
    `
      SELECT department_id, department_name
      FROM department
      ORDER BY department_name
    `
  );

  return result.rows;
}

async function searchStudents(filters) {
  const {
    studentName,
    rollNumber,
    admissionYear,
    currentSemester,
    programId,
    email,
    phone,
    gender,
    dob,
    departmentId
  } = filters;

  const conditions = [];
  const params = [];

  if (studentName) {
    params.push(`%${studentName}%`);
    conditions.push(`u.name ILIKE $${params.length}`);
  }

  if (rollNumber) {
    params.push(`%${rollNumber}%`);
    conditions.push(`s.roll_number ILIKE $${params.length}`);
  }

  if (admissionYear) {
    params.push(admissionYear);
    conditions.push(`s.admission_year = $${params.length}`);
  }

  if (currentSemester) {
    params.push(currentSemester);
    conditions.push(`s.current_semester = $${params.length}`);
  }

  if (programId) {
    params.push(programId);
    conditions.push(`s.program_id = $${params.length}`);
  }

  if (email) {
    params.push(`%${email}%`);
    conditions.push(`u.email ILIKE $${params.length}`);
  }

  if (phone) {
    params.push(`%${phone}%`);
    conditions.push(`u.phone ILIKE $${params.length}`);
  }

  if (gender) {
    params.push(gender);
    conditions.push(`u.gender = $${params.length}`);
  }

  if (dob) {
    params.push(dob);
    conditions.push(`u.dob = $${params.length}`);
  }

  if (departmentId) {
    params.push(departmentId);
    conditions.push(`p.department_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `
      SELECT
        s.user_id,
        u.name,
        u.email,
        u.phone,
        u.gender,
        u.dob,
        s.roll_number,
        s.admission_year,
        s.current_semester,
        p.degree,
        p.branch,
        d.department_name
      FROM student s
      JOIN app_user u ON u.user_id = s.user_id
      JOIN program p ON p.program_id = s.program_id
      JOIN department d ON d.department_id = p.department_id
      ${whereClause}
      ORDER BY s.admission_year DESC, s.roll_number
      LIMIT 1000
    `,
    params
  );

  return result.rows;
}

async function searchFaculty(filters) {
  const {
    facultyName,
    employeeCode,
    designation,
    departmentId,
    email,
    phone,
    gender,
    dob
  } = filters;

  const conditions = [];
  const params = [];

  if (facultyName) {
    params.push(`%${facultyName}%`);
    conditions.push(`u.name ILIKE $${params.length}`);
  }

  if (employeeCode) {
    const normalizedEmployeeCode = employeeCode.replace(/[^A-Za-z0-9]/g, '');
    params.push(`%${normalizedEmployeeCode}%`);
    conditions.push(`regexp_replace(f.employee_code, '[^A-Za-z0-9]', '', 'g') ILIKE $${params.length}`);
  }

  if (designation) {
    params.push(designation);
    conditions.push(`LOWER(TRIM(f.designation)) = LOWER(TRIM($${params.length}))`);
  }

  if (departmentId) {
    params.push(departmentId);
    conditions.push(`f.department_id = $${params.length}`);
  }

  if (email) {
    params.push(`%${email}%`);
    conditions.push(`u.email ILIKE $${params.length}`);
  }

  if (phone) {
    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    params.push(`%${normalizedPhone}%`);
    conditions.push(`regexp_replace(u.phone, '[^0-9]', '', 'g') ILIKE $${params.length}`);
  }

  if (gender) {
    params.push(gender);
    conditions.push(`u.gender = $${params.length}`);
  }

  if (dob) {
    params.push(dob);
    conditions.push(`u.dob = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `
      SELECT
        f.user_id,
        u.name,
        u.email,
        u.phone,
        u.gender,
        u.dob,
        f.employee_code,
        f.designation,
        d.department_name
      FROM faculty f
      JOIN app_user u ON u.user_id = f.user_id
      JOIN department d ON d.department_id = f.department_id
      ${whereClause}
      ORDER BY u.name
      LIMIT 1000
    `,
    params
  );

  return result.rows;
}

async function listFacultyDesignations() {
  const result = await query(
    `
      SELECT DISTINCT designation
      FROM faculty
      ORDER BY designation
    `
  );

  return result.rows.map((row) => row.designation);
}

async function listAdmissionYears() {
  const result = await query(
    `
      SELECT DISTINCT admission_year
      FROM student
      ORDER BY admission_year DESC
    `
  );

  return result.rows.map((row) => row.admission_year);
}

async function listCurrentSemesters() {
  const result = await query(
    `
      SELECT DISTINCT current_semester
      FROM student
      ORDER BY current_semester
    `
  );

  return result.rows.map((row) => row.current_semester);
}

async function listStudentBatches() {
  const result = await query(
    `
      SELECT
        s.admission_year,
        p.program_id,
        p.degree,
        p.branch,
        COUNT(*) AS student_count,
        MIN(s.roll_number) AS first_roll,
        MAX(s.roll_number) AS last_roll
      FROM student s
      JOIN program p ON p.program_id = s.program_id
      GROUP BY s.admission_year, p.program_id, p.degree, p.branch
      ORDER BY s.admission_year DESC, p.degree, p.branch
    `
  );

  return result.rows;
}

async function listFacultyDirectory() {
  const result = await query(
    `
      SELECT f.user_id, u.name, f.employee_code, f.designation, d.department_name
      FROM faculty f
      JOIN app_user u ON u.user_id = f.user_id
      JOIN department d ON d.department_id = f.department_id
      ORDER BY u.name
    `
  );

  return result.rows;
}

async function listCourseOfferings() {
  const result = await query(
    `
      SELECT
        co.offering_id,
        co.academic_year,
        co.section,
        c.course_id,
        c.course_name,
        STRING_AGG(DISTINCT u.name, ', ' ORDER BY u.name) AS faculty_names,
        COUNT(DISTINCT e.enrollment_id) AS enrollment_count
      FROM course_offering co
      JOIN course c ON c.course_id = co.course_id
      LEFT JOIN teaches t ON t.offering_id = co.offering_id
      LEFT JOIN faculty f ON f.user_id = t.faculty_id
      LEFT JOIN app_user u ON u.user_id = f.user_id
      LEFT JOIN enrollment e ON e.offering_id = co.offering_id
      GROUP BY co.offering_id, co.academic_year, co.section, c.course_id, c.course_name
      ORDER BY co.academic_year DESC, c.course_id, co.section
    `
  );

  return result.rows;
}

module.exports = {
  getAdminSnapshot,
  listCompanies,
  listPlacementOffers,
  listCourseCatalog,
  listPrograms,
  listDepartments,
  listStudentBatches,
  searchStudents,
  searchFaculty,
  listFacultyDesignations,
  listAdmissionYears,
  listCurrentSemesters,
  listFacultyDirectory,
  listCourseOfferings
};
