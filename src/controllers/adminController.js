const adminModel = require('../models/adminModel');
const adminService = require('../services/adminService');

async function showAdminConsole(req, res) {
  const [snapshot, companies, placementOffers, courseCatalog, courseOfferings, facultyDirectory, programs, studentBatches] = await Promise.all([
    adminModel.getAdminSnapshot(),
    adminModel.listCompanies(),
    adminModel.listPlacementOffers(),
    adminModel.listCourseCatalog(),
    adminModel.listCourseOfferings(),
    adminModel.listFacultyDirectory(),
    adminModel.listPrograms(),
    adminModel.listStudentBatches()
  ]);

  return res.render('admin/index', {
    title: 'Admin Console',
    snapshot,
    companies,
    placementOffers,
    courseCatalog,
    courseOfferings,
    facultyDirectory,
    programs,
    studentBatches
  });
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
    applicationDeadline: req.body.applicationDeadline
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

async function createStudentBatch(req, res) {
  const result = await adminService.createStudentBatch({
    programId: Number(req.body.programId),
    admissionYear: Number(req.body.admissionYear),
    namesText: req.body.studentNames,
    defaultGender: req.body.defaultGender,
    defaultDob: req.body.defaultDob,
    semester: Number(req.body.currentSemester || 1)
  });

  req.flash(
    'success',
    `${result.createdCount} students created. Branch code ${result.branchCode}. Default password pattern: ${result.defaultPasswordPattern}.`
  );
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
  createCompany,
  createPlacementOffer,
  createCourseOffering,
  assignFaculty,
  createStudentBatch,
  showPeopleDirectory,
  showStudentsDirectory,
  showFacultyDirectory
};
