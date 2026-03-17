const { withTransaction } = require('../config/db');
const bcrypt = require('bcryptjs');
const ServiceError = require('./serviceError');

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
    applicationDeadline
  } = payload;

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
          application_deadline
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING offer_id
      `,
      [companyId, roleName, packageCtc, offerType, location || null, eligibleMinCpi, applicationDeadline || null]
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
        `,
        [facultyId, offeringId]
      );
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('That faculty member is already assigned to the selected offering.');
    }

    throw error;
  }
}

async function createStudentBatch(payload) {
  const {
    programId,
    admissionYear,
    namesText,
    defaultGender,
    defaultDob,
    semester
  } = payload;

  const names = (namesText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (names.length === 0) {
    throw new ServiceError('Please provide at least one student name (one per line).');
  }

  if (names.length > 500) {
    throw new ServiceError('Batch size too large. Please submit up to 500 students per request.');
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
    const defaultPasswordPattern = `Student@${admissionYear}`;
    const passwordHash = await bcrypt.hash(defaultPasswordPattern, 10);

    const existingRollsResult = await client.query(
      `
        SELECT roll_number
        FROM student
        WHERE roll_number LIKE $1
        FOR UPDATE
      `,
      [`${rollPrefix}%`]
    );

    let sequence = existingRollsResult.rows.reduce((maxSequence, row) => {
      const match = row.roll_number.match(/(\d{3})$/);
      if (!match) {
        return maxSequence;
      }

      return Math.max(maxSequence, Number.parseInt(match[1], 10));
    }, 0);

    const createdStudents = [];

    for (const fullName of names) {
      sequence += 1;
      const rollNumber = `${rollPrefix}${String(sequence).padStart(3, '0')}`;
      const institutionalEmail = `${rollNumber.toLowerCase()}@sums.edu`;
      const generatedPhone = `88${yearSuffix}${String(programId).padStart(2, '0')}${String(sequence).padStart(5, '0')}`;

      const userInsert = await client.query(
        `
          INSERT INTO app_user (name, email, phone, dob, gender, password, user_type)
          VALUES ($1, $2, $3, $4, $5, $6, 'STUDENT')
          RETURNING user_id
        `,
        [fullName, institutionalEmail, generatedPhone, defaultDob, defaultGender, passwordHash]
      );

      await client.query(
        `
          INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [userInsert.rows[0].user_id, programId, rollNumber, admissionYear, semester]
      );

      createdStudents.push({
        name: fullName,
        rollNumber,
        email: institutionalEmail
      });
    }

    return {
      createdCount: createdStudents.length,
      branchCode,
      defaultPasswordPattern,
      createdStudents
    };
    });
  } catch (error) {
    if (error.code === '23503') {
      throw new ServiceError('Invalid program reference supplied for batch creation.', 400);
    }

    if (error.code === '23505') {
      throw new ServiceError('Generated roll number, email, or phone conflicted with existing records. Please retry batch creation.', 409);
    }

    throw error;
  }
}

module.exports = {
  createCompany,
  createPlacementOffer,
  createCourseOffering,
  assignFaculty,
  createStudentBatch
};
