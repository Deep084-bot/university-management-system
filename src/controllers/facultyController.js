const env = require('../config/env');
const facultyModel = require('../models/facultyModel');
const teachingService = require('../services/teachingService');

const HOLIDAY_LABELS = {
  '01-26': 'Republic Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti'
};

function parseIsoDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getNoClassReason(date) {
  if (!date) {
    return null;
  }

  const day = date.getDay();
  if (day === 0 || day === 6) {
    return 'No classes on weekends (Saturday/Sunday).';
  }

  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (HOLIDAY_LABELS[monthDay]) {
    return `No classes on ${HOLIDAY_LABELS[monthDay]}.`;
  }

  return null;
}

async function showAttendance(req, res) {
  const facultyId = req.session.user.user_id;
  const offerings = await facultyModel.listTeachingOfferings(facultyId, env.currentAcademicYear);
  const selectedOfferingId = Number(req.query.offeringId || offerings[0]?.offering_id || 0);
  const selectedDate = req.query.date || new Date().toISOString().slice(0, 10);
  const parsedDate = parseIsoDate(selectedDate);
  const noClassReason = getNoClassReason(parsedDate);
  const roster = selectedOfferingId
    ? await facultyModel.getOfferingRoster(facultyId, selectedOfferingId, selectedDate)
    : [];

  let attendanceBanner = null;
  if (!parsedDate) {
    attendanceBanner = { type: 'error', message: 'Invalid attendance date. Please choose a valid date.' };
  } else if (noClassReason) {
    attendanceBanner = { type: 'info', message: noClassReason };
  } else if (selectedOfferingId && roster.length > 0 && roster.every((student) => !student.attendance_status)) {
    attendanceBanner = { type: 'info', message: 'Attendance not updated for the selected date.' };
  }

  return res.render('faculty/attendance', {
    title: 'Attendance Tracking',
    offerings,
    selectedOfferingId,
    selectedDate,
    roster,
    attendanceBanner
  });
}

async function saveAttendance(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const attendanceDate = req.body.attendanceDate;
  const parsedDate = parseIsoDate(attendanceDate);
  const noClassReason = getNoClassReason(parsedDate);

  if (!parsedDate) {
    req.flash('error', 'Invalid attendance date.');
    return res.redirect(`/faculty/attendance?offeringId=${offeringId}&date=${attendanceDate}`);
  }

  if (noClassReason) {
    req.flash('error', noClassReason);
    return res.redirect(`/faculty/attendance?offeringId=${offeringId}&date=${attendanceDate}`);
  }

  const attendanceByEnrollment = Object.entries(req.body)
    .filter(([key]) => key.startsWith('status_'))
    .reduce((accumulator, [key, value]) => {
      const enrollmentId = key.replace('status_', '');
      accumulator[enrollmentId] = value;
      return accumulator;
    }, {});

  await teachingService.markAttendance(facultyId, offeringId, attendanceDate, attendanceByEnrollment);
  req.flash('success', 'Attendance saved successfully.');
  return res.redirect(`/faculty/attendance?offeringId=${offeringId}&date=${attendanceDate}`);
}

async function showGrades(req, res) {
  const facultyId = req.session.user.user_id;
  const offerings = await facultyModel.listTeachingOfferings(facultyId, env.currentAcademicYear);
  const selectedOfferingId = Number(req.query.offeringId || offerings[0]?.offering_id || 0);
  const selectedComponentId = Number(req.query.componentId || 0);

  const roster = selectedOfferingId
    ? await facultyModel.getOfferingRoster(facultyId, selectedOfferingId)
    : [];
  const components = selectedOfferingId
    ? await facultyModel.listAssessmentComponents(facultyId, selectedOfferingId)
    : [];
  const selectedComponent = components.find((component) => Number(component.component_id) === selectedComponentId) || null;
  const marks = selectedOfferingId && selectedComponentId
    ? await facultyModel.getComponentMarks(facultyId, selectedOfferingId, selectedComponentId)
    : [];
  const gradebook = selectedOfferingId
    ? await facultyModel.getGradebook(facultyId, selectedOfferingId)
    : [];

  const marksByEnrollment = Object.fromEntries(
    marks.map((entry) => [entry.enrollment_id, entry])
  );

  return res.render('faculty/grades', {
    title: 'Grade Management',
    offerings,
    selectedOfferingId,
    selectedComponentId,
    selectedComponent,
    roster,
    components,
    marksByEnrollment,
    gradebook
  });
}

async function addComponent(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const { type, weightage, maxMarks } = req.body;

  const component = await teachingService.addAssessmentComponent(
    facultyId,
    offeringId,
    type,
    Number(weightage),
    Number(maxMarks)
  );
  req.flash('success', 'Assessment component created.');
  return res.redirect(`/faculty/grades?offeringId=${offeringId}&componentId=${component.component_id}`);
}

async function saveMarks(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const componentId = Number(req.body.componentId);
  const marksByEnrollment = Object.entries(req.body)
    .filter(([key]) => key.startsWith('marks_'))
    .reduce((accumulator, [key, value]) => {
      const enrollmentId = key.replace('marks_', '');
      accumulator[enrollmentId] = value;
      return accumulator;
    }, {});

  await teachingService.upsertMarks(facultyId, offeringId, componentId, marksByEnrollment);
  req.flash('success', 'Marks updated successfully.');
  return res.redirect(`/faculty/grades?offeringId=${offeringId}&componentId=${componentId}`);
}

async function publishGrades(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const gradesByEnrollment = Object.entries(req.body)
    .filter(([key]) => key.startsWith('grade_'))
    .reduce((accumulator, [key, value]) => {
      const enrollmentId = key.replace('grade_', '');
      accumulator[enrollmentId] = value;
      return accumulator;
    }, {});

  await teachingService.publishGrades(facultyId, offeringId, gradesByEnrollment);
  req.flash('success', 'Final grades published.');
  return res.redirect(`/faculty/grades?offeringId=${offeringId}`);
}

async function showFinalizeSemester(req, res) {
  const facultyId = req.session.user.user_id;
  const offerings = await facultyModel.listTeachingOfferings(facultyId, env.currentAcademicYear);
  const selectedOfferingId = Number(req.query.offeringId || offerings[0]?.offering_id || 0);

  const roster = selectedOfferingId
    ? await facultyModel.getOfferingRoster(facultyId, selectedOfferingId)
    : [];

  // Get detailed semester info for each student
  const studentDetailsPromises = roster.map((student) =>
    facultyModel.getStudentAllSemesters(facultyId, student.student_id)
  );
  const studentDetails = await Promise.all(studentDetailsPromises);

  const studentDetailsByEnrollment = Object.fromEntries(
    roster.map((student, idx) => [student.enrollment_id, studentDetails[idx]])
  );

  return res.render('faculty/finalize-semester', {
    title: 'Finalize Semester Results',
    offerings,
    selectedOfferingId,
    roster,
    studentDetailsByEnrollment
  });
}

async function finalizeSemester(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const marksByEnrollment = Object.entries(req.body)
    .filter(([key]) => key.startsWith('finalMarks_'))
    .reduce((accumulator, [key, value]) => {
      const enrollmentId = key.replace('finalMarks_', '');
      accumulator[enrollmentId] = value;
      return accumulator;
    }, {});

  await teachingService.finalizeSemesterMarks(facultyId, offeringId, marksByEnrollment);
  req.flash('success', 'Semester results finalized and SPI calculated.');
  return res.redirect(`/faculty/grades?offeringId=${offeringId}`);
}

module.exports = {
  showAttendance,
  saveAttendance,
  showGrades,
  addComponent,
  saveMarks,
  publishGrades,
  showFinalizeSemester,
  finalizeSemester
};
