const env = require('../config/env');
const studentModel = require('../models/studentModel');
const facultyModel = require('../models/facultyModel');
const placementModel = require('../models/placementModel');
const adminModel = require('../models/adminModel');

async function showDashboard(req, res) {
  const { user } = req.session;
  let summary = {};

  if (user.user_type === 'STUDENT') {
    const [profile, currentEnrollments, availableOfferings, applications] = await Promise.all([
      studentModel.getStudentProfile(user.user_id),
      studentModel.listCurrentEnrollments(user.user_id),
      studentModel.listAvailableOfferings(user.user_id, env.currentAcademicYear),
      placementModel.listApplications(user.user_id)
    ]);

    summary = {
      profile,
      metrics: [
        { label: 'Current Enrollments', value: currentEnrollments.length },
        { label: 'Open Registrations', value: availableOfferings.length },
        { label: 'Placement Applications', value: applications.length }
      ]
    };
  }

  if (user.user_type === 'FACULTY') {
    const [profile, offerings] = await Promise.all([
      facultyModel.getFacultyProfile(user.user_id),
      facultyModel.listTeachingOfferings(user.user_id, env.currentAcademicYear)
    ]);

    const totalStudents = offerings.reduce((sum, offering) => sum + Number(offering.student_count), 0);
    summary = {
      profile,
      metrics: [
        { label: 'Active Offerings', value: offerings.length },
        { label: 'Students Served', value: totalStudents },
        { label: 'Academic Year', value: env.currentAcademicYear }
      ]
    };
  }

  if (user.user_type === 'ADMIN') {
    const snapshot = await adminModel.getAdminSnapshot();

    summary = {
      profile: {
        name: user.name,
        admin_code: user.admin_code
      },
      metrics: [
        { label: 'Students', value: snapshot.student_count },
        { label: 'Faculty', value: snapshot.faculty_count },
        { label: 'Course Offerings', value: snapshot.offering_count },
        { label: 'Placement Offers', value: snapshot.placement_offer_count },
        { label: 'Applications', value: snapshot.application_count }
      ]
    };
  }

  return res.render('dashboard/index', {
    title: 'Dashboard',
    summary
  });
}

module.exports = {
  showDashboard
};
