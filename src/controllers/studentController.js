const env = require('../config/env');
const studentModel = require('../models/studentModel');
const enrollmentService = require('../services/enrollmentService');

async function showCourseRegistration(req, res) {
  const studentId = req.session.user.user_id;
  const [profile, currentEnrollments, availableOfferings, semesterResults] = await Promise.all([
    studentModel.getStudentProfile(studentId),
    studentModel.listCurrentEnrollments(studentId),
    studentModel.listAvailableOfferings(studentId, env.currentAcademicYear),
    studentModel.listSemesterResults(studentId)
  ]);

  return res.render('students/courses', {
    title: 'Course Registration',
    profile,
    currentEnrollments,
    availableOfferings,
    semesterResults
  });
}

async function registerCourse(req, res) {
  const studentId = req.session.user.user_id;
  const { offeringId, enrollmentType } = req.body;

  const result = await enrollmentService.registerStudent(studentId, Number(offeringId), enrollmentType);
  req.flash('success', `Registered successfully for ${result.courseName}.`);
  return res.redirect('/student/courses');
}

module.exports = {
  showCourseRegistration,
  registerCourse
};
