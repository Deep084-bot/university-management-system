const adminModel = require('../models/adminModel');
const adminService = require('../services/adminService');
const env = require('../config/env');

async function showAdminConsole(req, res) {
  const [
    snapshot,
    companies,
    placementOffers,
    courseCatalog,
    courseOfferings,
    facultyDirectory,
    programs,
    departments,
    adminUsers,
    credentialIssuances
  ] = await Promise.all([
    adminModel.getAdminSnapshot(),
    adminModel.listCompanies(),
    adminModel.listPlacementOffers(),
    adminModel.listCourseCatalog(),
    adminModel.listCourseOfferings(),
    adminModel.listFacultyDirectory(),
    adminModel.listPrograms(),
    adminModel.listDepartments(),
    adminModel.listAdminUsers(),
    adminModel.listRecentCredentialIssuances(100)
  ]);

  const academicYearStart = Number.parseInt(String(env.currentAcademicYear).split('-')[0], 10);
  const maxGraduatingBatch = Number.isNaN(academicYearStart)
    ? new Date().getFullYear() + 4
    : academicYearStart + 4;
  const placementBatchOptions = [
    maxGraduatingBatch - 3,
    maxGraduatingBatch - 2,
    maxGraduatingBatch - 1,
    maxGraduatingBatch
  ].filter((value, index, source) => value >= 2000 && source.indexOf(value) === index);

  return res.render('admin/index', {
    title: 'Admin Console',
    snapshot,
    companies,
    placementOffers,
    courseCatalog,
    courseOfferings,
    facultyDirectory,
    programs,
    departments,
    maxGraduatingBatch,
    placementBatchOptions,
    adminUsers,
    credentialIssuances
  });
}

async function createDepartment(req, res) {
  await adminService.createDepartment({
    departmentName: req.body.departmentName
  });

  req.flash('success', 'Department created successfully.');
  return res.redirect('/admin');
}

async function createProgram(req, res) {
  await adminService.createProgram({
    departmentId: Number(req.body.departmentId),
    degree: req.body.degree,
    branch: req.body.branch,
    durationYears: Number(req.body.durationYears)
  });

  req.flash('success', 'Program created successfully.');
  return res.redirect('/admin');
}

async function createCourse(req, res) {
  await adminService.createCourse({
    courseId: req.body.courseId,
    courseName: req.body.courseName,
    credits: Number(req.body.credits),
    category: req.body.category,
    minAttendanceReq: Number(req.body.minAttendanceReq),
    programId: Number(req.body.programId),
    semesterNo: Number(req.body.semesterNo)
  });

  req.flash('success', 'Course created successfully.');
  return res.redirect('/admin');
}

async function createStudentAccount(req, res) {
  const result = await adminService.createStudentAccount({
    name: req.body.name,
    phone: req.body.phone,
    dob: req.body.dob,
    gender: req.body.gender,
    programId: Number(req.body.programId),
    admissionYear: Number(req.body.admissionYear),
    currentSemester: Number(req.body.currentSemester),
    academicStatus: req.body.academicStatus,
    currCpi: Number(req.body.currCpi || 0)
  });

  req.flash(
    'success',
    `Student created. Roll: ${result.generatedRollNumber}, Email: ${result.generatedEmail}, Temporary Password: ${result.generatedPassword}. ${result.reassignments} existing roll numbers were resequenced.`
  );
  return res.redirect('/admin');
}

async function createFacultyAccount(req, res) {
  const result = await adminService.createFacultyAccount({
    name: req.body.name,
    phone: req.body.phone,
    dob: req.body.dob,
    gender: req.body.gender,
    departmentId: Number(req.body.departmentId),
    designation: req.body.designation,
    experienceYears: Number(req.body.experienceYears || 0),
    qualification: req.body.qualification
  });

  req.flash(
    'success',
    `Faculty created. Employee Code: ${result.generatedEmployeeCode}, Email: ${result.generatedEmail}, Temporary Password: ${result.generatedPassword}.`
  );
  return res.redirect('/admin');
}

async function previewFacultyEmployeeCode(req, res) {
  const result = await adminService.previewNextFacultyEmployeeCode(Number(req.query.departmentId));
  return res.json(result);
}

async function createAdminAccount(req, res) {
  await adminService.createAdminAccount({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    dob: req.body.dob,
    gender: req.body.gender,
    password: req.body.password,
    role: req.body.role
  });

  req.flash('success', 'Admin account created successfully.');
  return res.redirect('/admin');
}

async function createCompany(req, res) {
  await adminService.createCompany({
    companyName: req.body.companyName,
    contact: req.body.contact,
    email: req.body.email,
    industryType: req.body.industryType
  });

  req.flash('success', 'Company created successfully.');
  return res.redirect('/admin');
}

async function createPlacementOffer(req, res) {
  await adminService.createPlacementOffer({
    companyId: Number(req.body.companyId),
    roleName: req.body.roleName,
    packageCtc: Number(req.body.packageCtc),
    offerType: req.body.offerType,
    location: req.body.location,
    eligibleMinCpi: Number(req.body.eligibleMinCpi),
    applicationDeadline: req.body.applicationDeadline,
    graduatingBatchFrom: Number(req.body.graduatingBatchFrom),
    applyToHigherBatches: req.body.applyToHigherBatches === 'on'
  });

  req.flash('success', 'Placement offer created successfully.');
  return res.redirect('/admin');
}

async function createCourseOffering(req, res) {
  await adminService.createCourseOffering({
    courseId: req.body.courseId,
    academicYear: req.body.academicYear,
    section: req.body.section
  });

  req.flash('success', 'Course offering created successfully.');
  return res.redirect('/admin');
}

async function assignFaculty(req, res) {
  await adminService.assignFaculty({
    facultyId: Number(req.body.facultyId),
    offeringId: Number(req.body.offeringId)
  });

  req.flash('success', 'Faculty assignment saved successfully.');
  return res.redirect('/admin');
}

async function showPeopleDirectory(req, res) {
  const studentFilters = {
    studentName: (req.query.studentName || '').trim(),
    rollNumber: (req.query.rollNumber || '').trim(),
    admissionYear: req.query.admissionYear ? Number(req.query.admissionYear) : null,
    currentSemester: req.query.currentSemester ? Number(req.query.currentSemester) : null,
    programId: req.query.programId ? Number(req.query.programId) : null,
    email: (req.query.studentEmail || '').trim()
  };

  const facultyFilters = {
    facultyName: (req.query.facultyName || '').trim(),
    employeeCode: (req.query.employeeCode || '').trim(),
    designation: (req.query.designation || '').trim(),
    departmentId: req.query.departmentId ? Number(req.query.departmentId) : null,
    email: (req.query.facultyEmail || '').trim()
  };

  const [students, facultyMembers, programs, departments] = await Promise.all([
    adminModel.searchStudents(studentFilters),
    adminModel.searchFaculty(facultyFilters),
    adminModel.listPrograms(),
    adminModel.listDepartments()
  ]);

  return res.render('admin/people', {
    title: 'People Directory',
    students,
    facultyMembers,
    programs,
    departments,
    studentFilters,
    facultyFilters
  });
}

async function showStudentsDirectory(req, res) {
  const studentFilters = {
    studentName: (req.query.studentName || '').trim(),
    rollNumber: (req.query.rollNumber || '').trim(),
    admissionYear: req.query.admissionYear ? Number(req.query.admissionYear) : null,
    currentSemester: req.query.currentSemester ? Number(req.query.currentSemester) : null,
    programId: req.query.programId ? Number(req.query.programId) : null,
    departmentId: req.query.departmentId ? Number(req.query.departmentId) : null,
    email: (req.query.studentEmail || '').trim(),
    phone: (req.query.studentPhone || '').trim(),
    gender: (req.query.studentGender || '').trim(),
    dob: (req.query.studentDob || '').trim()
  };

  const [students, programs, departments, admissionYears, semesters] = await Promise.all([
    adminModel.searchStudents(studentFilters),
    adminModel.listPrograms(),
    adminModel.listDepartments(),
    adminModel.listAdmissionYears(),
    adminModel.listCurrentSemesters()
  ]);

  return res.render('admin/students-directory', {
    title: 'Students Directory',
    students,
    programs,
    departments,
    admissionYears,
    semesters,
    studentFilters
  });
}

async function showFacultyDirectory(req, res) {
  const facultyFilters = {
    facultyName: (req.query.facultyName || '').trim(),
    employeeCode: (req.query.employeeCode || '').trim(),
    designation: (req.query.designation || '').trim(),
    departmentId: req.query.departmentId ? Number(req.query.departmentId) : null,
    email: (req.query.facultyEmail || '').trim(),
    phone: (req.query.facultyPhone || '').trim(),
    gender: (req.query.facultyGender || '').trim(),
    dob: (req.query.facultyDob || '').trim()
  };

  const [facultyMembers, departments, designations] = await Promise.all([
    adminModel.searchFaculty(facultyFilters),
    adminModel.listDepartments(),
    adminModel.listFacultyDesignations()
  ]);

  return res.render('admin/faculty-directory', {
    title: 'Faculty Directory',
    facultyMembers,
    departments,
    designations,
    facultyFilters
  });
}

module.exports = {
  showAdminConsole,
  createDepartment,
  createProgram,
  createCourse,
  createStudentAccount,
  createFacultyAccount,
  previewFacultyEmployeeCode,
  createAdminAccount,
  createCompany,
  createPlacementOffer,
  createCourseOffering,
  assignFaculty,
  showPeopleDirectory,
  showStudentsDirectory,
  showFacultyDirectory
};
