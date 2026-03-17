const env = require('../config/env');
const facultyModel = require('../models/facultyModel');
const teachingService = require('../services/teachingService');

async function showAttendance(req, res) {
  const facultyId = req.session.user.user_id;
  const offerings = await facultyModel.listTeachingOfferings(facultyId, env.currentAcademicYear);
  const selectedOfferingId = Number(req.query.offeringId || offerings[0]?.offering_id || 0);
  const selectedDate = req.query.date || new Date().toISOString().slice(0, 10);
  const roster = selectedOfferingId
    ? await facultyModel.getOfferingRoster(facultyId, selectedOfferingId, selectedDate)
    : [];

  return res.render('faculty/attendance', {
    title: 'Attendance Tracking',
    offerings,
    selectedOfferingId,
    selectedDate,
    roster
  });
}

async function saveAttendance(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const attendanceDate = req.body.attendanceDate;
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
  const marks = selectedOfferingId && selectedComponentId
    ? await facultyModel.getComponentMarks(facultyId, selectedOfferingId, selectedComponentId)
    : [];

  const marksByEnrollment = Object.fromEntries(
    marks.map((entry) => [entry.enrollment_id, entry.marks_obtained])
  );

  return res.render('faculty/grades', {
    title: 'Grade Management',
    offerings,
    selectedOfferingId,
    selectedComponentId,
    roster,
    components,
    marksByEnrollment
  });
}

async function addComponent(req, res) {
  const facultyId = req.session.user.user_id;
  const offeringId = Number(req.body.offeringId);
  const { type, weightage, maxMarks } = req.body;

  await teachingService.addAssessmentComponent(facultyId, offeringId, type, Number(weightage), Number(maxMarks));
  req.flash('success', 'Assessment component created.');
  return res.redirect(`/faculty/grades?offeringId=${offeringId}`);
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

module.exports = {
  showAttendance,
  saveAttendance,
  showGrades,
  addComponent,
  saveMarks,
  publishGrades
};
