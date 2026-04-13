const express = require('express');

const adminController = require('../controllers/adminController');
const asyncHandler = require('../middleware/asyncHandler');
const { ensureRole } = require('../middleware/auth');

const router = express.Router();

router.use(ensureRole('ADMIN'));
router.get('/', asyncHandler(adminController.showAdminConsole));
router.get('/people', asyncHandler(adminController.showPeopleDirectory));
router.get('/students-directory', asyncHandler(adminController.showStudentsDirectory));
router.get('/faculty-directory', asyncHandler(adminController.showFacultyDirectory));
router.get('/faculty/next-employee-code', asyncHandler(adminController.previewFacultyEmployeeCode));
router.post('/departments', asyncHandler(adminController.createDepartment));
router.post('/programs', asyncHandler(adminController.createProgram));
router.post('/courses', asyncHandler(adminController.createCourse));
router.post('/accounts/students', asyncHandler(adminController.createStudentAccount));
router.post('/accounts/faculty', asyncHandler(adminController.createFacultyAccount));
router.post('/accounts/admins', asyncHandler(adminController.createAdminAccount));
router.post('/companies', asyncHandler(adminController.createCompany));
router.post('/placement-offers', asyncHandler(adminController.createPlacementOffer));
router.post('/course-offerings', asyncHandler(adminController.createCourseOffering));
router.post('/faculty-assignments', asyncHandler(adminController.assignFaculty));

module.exports = router;
