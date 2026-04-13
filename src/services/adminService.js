const { withTransaction, query } = require('../config/db');
const bcrypt = require('bcryptjs');
const ServiceError = require('./serviceError');
const env = require('../config/env');

function ensureRequired(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ServiceError(`${label} is required.`);
  }
}

function normalizeOptionalNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new ServiceError('Invalid numeric value provided.');
  }

  return parsed;
}

async function logGeneratedCredential(client, { userId, userType, generatedEmail, generatedPassword }) {
  await client.query(
    `
      INSERT INTO credential_issuance_log (
        user_id,
        user_type,
        generated_email,
        generated_password,
        is_active
      )
      VALUES ($1, $2, $3, $4, TRUE)
    `,
    [userId, userType, generatedEmail, generatedPassword]
  );
}

function buildBranchCode(degree, branch) {
  const degreeInitial = (degree || '').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'X';
  const words = (branch || '')
    .match(/[A-Za-z]+/g)
    ?.map((word) => word.toLowerCase())
    .filter((word) => !['and', 'of', 'the', 'engineering', 'technology'].includes(word)) || [];

  let branchLetters = words.map((word) => word.charAt(0)).join('').toUpperCase();
  if (branchLetters.length < 2) {
    branchLetters = (branch || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
  }

  if (branchLetters.length < 2) {
    branchLetters = (branchLetters + 'XX').slice(0, 2);
  }

  return `${degreeInitial}${branchLetters.slice(0, 2)}`;
}

function buildDepartmentCode(departmentName) {
  const tokens = String(departmentName || '')
    .match(/[A-Za-z0-9]+/g)
    ?.map((token) => token.toUpperCase()) || [];

  if (tokens.length === 0) {
    return 'DEP';
  }

  const initials = tokens.map((token) => token.charAt(0)).join('');
  const compact = tokens.join('');
  const code = (initials.length >= 3 ? initials : compact).replace(/[^A-Z0-9]/g, '');

  return (code + 'DEP').slice(0, 3);
}

function parseEmployeeCodeSequence(employeeCode, prefix) {
  const match = String(employeeCode || '').match(new RegExp(`^${prefix}(\\d+)$`));
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) || 0;
}

async function generateNextFacultyEmployeeCode(client, departmentId, shouldLockRows = true) {
  const departmentResult = await client.query(
    `
      SELECT department_id, department_name
      FROM department
      WHERE department_id = $1
      FOR KEY SHARE
    `,
    [departmentId]
  );

  if (departmentResult.rowCount === 0) {
    throw new ServiceError('Selected department does not exist.', 404);
  }

  const departmentName = departmentResult.rows[0].department_name;
  const departmentCode = buildDepartmentCode(departmentName);

  const facultyResult = await client.query(
    `
      SELECT employee_code
      FROM faculty
      WHERE department_id = $1
        AND employee_code LIKE $2
      ${shouldLockRows ? 'FOR UPDATE' : ''}
    `,
    [departmentId, `${departmentCode}%`]
  );

  const maxSequence = facultyResult.rows.reduce((maxValue, row) => {
    return Math.max(maxValue, parseEmployeeCodeSequence(row.employee_code, departmentCode));
  }, 0);

  return `${departmentCode}${String(maxSequence + 1).padStart(3, '0')}`;
}

async function previewNextFacultyEmployeeCode(departmentId) {
  const numericDepartmentId = Number(departmentId);
  if (Number.isNaN(numericDepartmentId)) {
    throw new ServiceError('Valid department is required.');
  }

  const readOnlyClient = { query };
  const employeeCode = await generateNextFacultyEmployeeCode(readOnlyClient, numericDepartmentId, false);
  return { employeeCode };
}

async function createDepartment(payload) {
  const departmentName = String(payload.departmentName || '').trim();
  ensureRequired(departmentName, 'Department name');

  try {
    return await withTransaction(async (client) => {
      const result = await client.query(
        `
          INSERT INTO department (department_name)
          VALUES ($1)
          RETURNING department_id
        `,
        [departmentName]
      );

      return result.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('A department with that name already exists.');
    }

    throw error;
  }
}

async function createProgram(payload) {
  const departmentId = Number(payload.departmentId);
  const degree = String(payload.degree || '').trim();
  const branch = String(payload.branch || '').trim();
  const durationYears = Number(payload.durationYears);

  if (Number.isNaN(departmentId)) {
    throw new ServiceError('Valid department is required.');
  }

  if (Number.isNaN(durationYears)) {
    throw new ServiceError('Valid duration is required.');
  }

  ensureRequired(degree, 'Degree');
  ensureRequired(branch, 'Branch');

  try {
    return await withTransaction(async (client) => {
      const departmentResult = await client.query(
        `
          SELECT department_id
          FROM department
          WHERE department_id = $1
          FOR KEY SHARE
        `,
        [departmentId]
      );

      if (departmentResult.rowCount === 0) {
        throw new ServiceError('Selected department does not exist.', 404);
      }

      const result = await client.query(
        `
          INSERT INTO program (department_id, degree, branch, duration_years)
          VALUES ($1, $2, $3, $4)
          RETURNING program_id
        `,
        [departmentId, degree, branch, durationYears]
      );

      return result.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('That program already exists for the selected department.');
    }

    throw error;
  }
}

async function createCourse(payload) {
  const courseId = String(payload.courseId || '').trim().toUpperCase();
  const courseName = String(payload.courseName || '').trim();
  const credits = Number(payload.credits);
  const category = String(payload.category || '').trim();
  const minAttendanceReq = Number(payload.minAttendanceReq);
  const programId = Number(payload.programId);
  const semesterNo = Number(payload.semesterNo);

  ensureRequired(courseId, 'Course ID');
  ensureRequired(courseName, 'Course name');

  if ([credits, minAttendanceReq, programId, semesterNo].some((value) => Number.isNaN(value))) {
    throw new ServiceError('Please provide valid course numeric fields.');
  }

  try {
    return await withTransaction(async (client) => {
      const programResult = await client.query(
        `
          SELECT program_id, degree, branch
          FROM program
          WHERE program_id = $1
          FOR KEY SHARE
        `,
        [programId]
      );

      if (programResult.rowCount === 0) {
        throw new ServiceError('Selected program does not exist.', 404);
      }

      const result = await client.query(
        `
          INSERT INTO course (
            course_id,
            course_name,
            credits,
            category,
            min_attendance_req,
            program_id,
            semester_no
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING course_id
        `,
        [courseId, courseName, credits, category, minAttendanceReq, programId, semesterNo]
      );

      return result.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('A course with that ID already exists.');
    }

    throw error;
  }
}

async function createAdminAccount(payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const dob = payload.dob;
  const gender = String(payload.gender || '').trim();
  const password = String(payload.password || '');
  const role = String(payload.role || '').trim() || 'Administrator';

  ensureRequired(name, 'Name');
  ensureRequired(email, 'Email');
  ensureRequired(phone, 'Phone');
  ensureRequired(dob, 'Date of birth');
  ensureRequired(gender, 'Gender');
  ensureRequired(password, 'Password');

  try {
    return await withTransaction(async (client) => {
      const passwordHash = await bcrypt.hash(password, 10);

      const userResult = await client.query(
        `
          INSERT INTO app_user (name, email, phone, dob, gender, password, user_type)
          VALUES ($1, $2, $3, $4, $5, $6, 'ADMIN')
          RETURNING user_id
        `,
        [name, email, phone, dob, gender, passwordHash]
      );

      await client.query(
        `
          INSERT INTO admin_user (user_id, role)
          VALUES ($1, $2)
        `,
        [userResult.rows[0].user_id, role]
      );

      return userResult.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('Email or phone already exists for another user.', 409);
    }

    throw error;
  }
}

async function createFacultyAccount(payload) {
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const dob = payload.dob;
  const gender = String(payload.gender || '').trim();
  const departmentId = Number(payload.departmentId);
  const designation = String(payload.designation || '').trim();
  const experienceYears = normalizeOptionalNumber(payload.experienceYears, 0);
  const qualification = String(payload.qualification || '').trim() || 'Not Provided';

  ensureRequired(name, 'Name');
  ensureRequired(phone, 'Phone');
  ensureRequired(dob, 'Date of birth');
  ensureRequired(gender, 'Gender');
  ensureRequired(designation, 'Designation');

  if (Number.isNaN(departmentId)) {
    throw new ServiceError('Valid department is required.');
  }

  try {
    return await withTransaction(async (client) => {
      const generatedEmployeeCode = await generateNextFacultyEmployeeCode(client, departmentId, true);
      const generatedEmail = `${generatedEmployeeCode.toLowerCase()}@sums.edu`;
      const generatedPassword = generatedEmployeeCode;
      const passwordHash = await bcrypt.hash(generatedPassword, 10);
      const userResult = await client.query(
        `
          INSERT INTO app_user (name, email, phone, dob, gender, password, must_change_password, user_type)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'FACULTY')
          RETURNING user_id
        `,
        [name, generatedEmail, phone, dob, gender, passwordHash]
      );

      await client.query(
        `
          INSERT INTO faculty (
            user_id,
            department_id,
            employee_code,
            designation,
            experience_years,
            qualification
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [userResult.rows[0].user_id, departmentId, generatedEmployeeCode, designation, experienceYears, qualification]
      );

      await logGeneratedCredential(client, {
        userId: userResult.rows[0].user_id,
        userType: 'FACULTY',
        generatedEmail,
        generatedPassword
      });

      return {
        ...userResult.rows[0],
        generatedEmployeeCode,
        generatedEmail,
        generatedPassword
      };
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('Generated faculty email, phone, or employee code already exists.', 409);
    }

    throw error;
  }
}

async function createStudentAccount(payload) {
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const dob = payload.dob;
  const gender = String(payload.gender || '').trim();
  const programId = Number(payload.programId);
  const admissionYear = Number(payload.admissionYear);
  const currentSemester = Number(payload.currentSemester);
  const academicStatus = String(payload.academicStatus || '').trim() || 'Active';
  const currCpi = normalizeOptionalNumber(payload.currCpi, 0);

  ensureRequired(name, 'Name');
  ensureRequired(phone, 'Phone');
  ensureRequired(dob, 'Date of birth');
  ensureRequired(gender, 'Gender');

  if ([programId, admissionYear, currentSemester].some((value) => Number.isNaN(value))) {
    throw new ServiceError('Program, admission year, and current semester are required.');
  }

  try {
    return await withTransaction(async (client) => {
      const programResult = await client.query(
        `
          SELECT program_id, degree, branch
          FROM program
          WHERE program_id = $1
          FOR KEY SHARE
        `,
        [programId]
      );

      if (programResult.rowCount === 0) {
        throw new ServiceError('Selected program does not exist.', 404);
      }

      const program = programResult.rows[0];
      const branchCode = buildBranchCode(program.degree, program.branch);
      const yearSuffix = String(admissionYear).slice(-2);
      const rollPrefix = `${yearSuffix}${branchCode}`;

      const temporaryPasswordHash = await bcrypt.hash(`TMP-${Date.now()}`, 10);
      const temporaryEmail = `tmp-student-${Date.now()}-${Math.floor(Math.random() * 100000)}@sums.local`;

      const userResult = await client.query(
        `
          INSERT INTO app_user (name, email, phone, dob, gender, password, must_change_password, user_type)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'STUDENT')
          RETURNING user_id
        `,
        [name, temporaryEmail, phone, dob, gender, temporaryPasswordHash]
      );

      const newUserId = userResult.rows[0].user_id;
      const temporaryRoll = `TMPNEW${newUserId}`;

      await client.query(
        `
          INSERT INTO student (
            user_id,
            program_id,
            roll_number,
            admission_year,
            current_semester,
            academic_status,
            curr_cpi
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          newUserId,
          programId,
          temporaryRoll,
          admissionYear,
          currentSemester,
          academicStatus,
          currCpi
        ]
      );

      const cohortResult = await client.query(
        `
          SELECT s.user_id, s.roll_number, u.name, u.must_change_password
          FROM student s
          JOIN app_user u ON u.user_id = s.user_id
          WHERE s.program_id = $1
            AND s.admission_year = $2
          ORDER BY s.user_id
          FOR UPDATE
        `,
        [programId, admissionYear]
      );

      const sortableStudents = cohortResult.rows
        .map((row) => ({
          userId: row.user_id,
          name: row.name,
          currentRollNumber: row.roll_number,
          mustChangePassword: row.must_change_password,
          isNew: row.user_id === newUserId
        }))
        .sort((a, b) => {
          const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          if (byName !== 0) {
            return byName;
          }

          return a.userId - b.userId;
        });

      const assignedRolls = sortableStudents.map((entry, index) => ({
        ...entry,
        nextRollNumber: `${rollPrefix}${String(index + 1).padStart(3, '0')}`
      }));

      for (const assignment of assignedRolls) {
        await client.query(
          `
            UPDATE student
            SET roll_number = $1
            WHERE user_id = $2
          `,
          [`TMP${assignment.userId}`, assignment.userId]
        );

        await client.query(
          `
            UPDATE app_user
            SET email = $1
            WHERE user_id = $2
          `,
          [`tmp-student-${assignment.userId}-${admissionYear}@sums.local`, assignment.userId]
        );
      }

      for (const assignment of assignedRolls) {
        await client.query(
          `
            UPDATE student
            SET roll_number = $1
            WHERE user_id = $2
          `,
          [assignment.nextRollNumber, assignment.userId]
        );

        await client.query(
          `
            UPDATE app_user
            SET email = $1
            WHERE user_id = $2
          `,
          [`${assignment.nextRollNumber.toLowerCase()}@sums.edu`, assignment.userId]
        );
      }

      const newStudentAssigned = assignedRolls.find((entry) => entry.userId === newUserId);
      const generatedRollNumber = newStudentAssigned.nextRollNumber;
      const generatedEmail = `${generatedRollNumber.toLowerCase()}@sums.edu`;
      const generatedPassword = generatedRollNumber;
      const finalPasswordHash = await bcrypt.hash(generatedPassword, 10);

      await client.query(
        `
          UPDATE app_user
          SET password = $2,
              must_change_password = TRUE
          WHERE user_id = $1
        `,
        [newUserId, finalPasswordHash]
      );

      await logGeneratedCredential(client, {
        userId: newUserId,
        userType: 'STUDENT',
        generatedEmail,
        generatedPassword
      });

      const existingReassignments = assignedRolls.filter(
        (entry) => !entry.isNew && entry.currentRollNumber !== entry.nextRollNumber
      );

      for (const reassignment of existingReassignments) {
        if (!reassignment.mustChangePassword) {
          continue;
        }

        const reassignedPasswordHash = await bcrypt.hash(reassignment.nextRollNumber, 10);

        await client.query(
          `
            UPDATE app_user
            SET password = $2,
                must_change_password = TRUE
            WHERE user_id = $1
          `,
          [reassignment.userId, reassignedPasswordHash]
        );

        await client.query(
          `
            UPDATE credential_issuance_log
            SET generated_email = $2,
                generated_password = $3,
                issued_at = CURRENT_TIMESTAMP,
                is_active = TRUE,
                consumed_at = NULL
            WHERE issuance_id = (
              SELECT issuance_id
              FROM credential_issuance_log
              WHERE user_id = $1
                AND user_type = 'STUDENT'
                AND is_active = TRUE
              ORDER BY issued_at DESC
              LIMIT 1
            )
          `,
          [
            reassignment.userId,
            `${reassignment.nextRollNumber.toLowerCase()}@sums.edu`,
            reassignment.nextRollNumber
          ]
        );
      }

      return {
        ...userResult.rows[0],
        generatedRollNumber,
        generatedEmail,
        generatedPassword,
        reassignments: existingReassignments.length
      };
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('Generated student credentials conflicted with existing records. Please retry.', 409);
    }

    throw error;
  }
}

async function createCompany(payload) {
  try {
    const { companyName, contact, email, industryType } = payload;

    return await withTransaction(async (client) => {
      const result = await client.query(
        `
          INSERT INTO company (company_name, contact, email, industry_type)
          VALUES ($1, $2, $3, $4)
          RETURNING company_id
        `,
        [companyName, contact, email, industryType]
      );

      return result.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('A company with that name already exists.');
    }

    throw error;
  }
}

async function createPlacementOffer(payload) {
  const {
    companyId,
    roleName,
    packageCtc,
    offerType,
    location,
    eligibleMinCpi,
    applicationDeadline,
    graduatingBatchFrom,
    applyToHigherBatches
  } = payload;

  const academicYearStart = Number.parseInt(String(env.currentAcademicYear).split('-')[0], 10);
  const maxGraduatingBatch = Number.isNaN(academicYearStart)
    ? new Date().getFullYear() + 4
    : academicYearStart + 4;
  const parsedGraduatingBatchFrom = Number(graduatingBatchFrom);

  if (Number.isNaN(parsedGraduatingBatchFrom)) {
    throw new ServiceError('A valid graduating batch is required.');
  }

  if (parsedGraduatingBatchFrom > maxGraduatingBatch) {
    throw new ServiceError(`Graduating batch cannot be greater than ${maxGraduatingBatch} for current academic year ${env.currentAcademicYear}.`);
  }

  const eligibleGradBatchTo = applyToHigherBatches ? maxGraduatingBatch : parsedGraduatingBatchFrom;

  return withTransaction(async (client) => {
    const companyResult = await client.query(
      `
        SELECT company_id
        FROM company
        WHERE company_id = $1
        FOR KEY SHARE
      `,
      [companyId]
    );

    if (companyResult.rowCount === 0) {
      throw new ServiceError('Selected company does not exist.', 404);
    }

    const result = await client.query(
      `
        INSERT INTO placement_offer (
          company_id,
          role_name,
          package_ctc,
          offer_type,
          location,
          eligible_min_cpi,
          eligible_grad_batch_from,
          eligible_grad_batch_to,
          application_deadline
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING offer_id
      `,
      [
        companyId,
        roleName,
        packageCtc,
        offerType,
        location || null,
        eligibleMinCpi,
        parsedGraduatingBatchFrom,
        eligibleGradBatchTo,
        applicationDeadline || null
      ]
    );

    return result.rows[0];
  });
}

async function createCourseOffering(payload) {
  const { courseId, academicYear, section } = payload;

  try {
    return await withTransaction(async (client) => {
      const courseResult = await client.query(
        `
          SELECT course_id
          FROM course
          WHERE course_id = $1
          FOR KEY SHARE
        `,
        [courseId]
      );

      if (courseResult.rowCount === 0) {
        throw new ServiceError('Selected course does not exist.', 404);
      }

      const result = await client.query(
        `
          INSERT INTO course_offering (course_id, academic_year, section)
          VALUES ($1, $2, $3)
          RETURNING offering_id
        `,
        [courseId, academicYear, section || 'A']
      );

      return result.rows[0];
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('That course offering already exists.');
    }

    throw error;
  }
}

async function assignFaculty(payload) {
  const { facultyId, offeringId } = payload;

  try {
    return await withTransaction(async (client) => {
      const facultyResult = await client.query(
        `
          SELECT user_id
          FROM faculty
          WHERE user_id = $1
          FOR KEY SHARE
        `,
        [facultyId]
      );

      if (facultyResult.rowCount === 0) {
        throw new ServiceError('Selected faculty member does not exist.', 404);
      }

      const offeringResult = await client.query(
        `
          SELECT offering_id
          FROM course_offering
          WHERE offering_id = $1
          FOR KEY SHARE
        `,
        [offeringId]
      );

      if (offeringResult.rowCount === 0) {
        throw new ServiceError('Selected course offering does not exist.', 404);
      }

      await client.query(
        `
          INSERT INTO teaches (faculty_id, offering_id)
          VALUES ($1, $2)
          ON CONFLICT (faculty_id, offering_id) DO NOTHING
        `,
        [facultyId, offeringId]
      );
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  previewNextFacultyEmployeeCode,
  createDepartment,
  createProgram,
  createCourse,
  createStudentAccount,
  createFacultyAccount,
  createAdminAccount,
  createCompany,
  createPlacementOffer,
  createCourseOffering,
  assignFaculty
};
