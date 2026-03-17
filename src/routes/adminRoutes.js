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
router.post('/companies', asyncHandler(adminController.createCompany));
router.post('/placement-offers', asyncHandler(adminController.createPlacementOffer));
router.post('/course-offerings', asyncHandler(adminController.createCourseOffering));
router.post('/faculty-assignments', asyncHandler(adminController.assignFaculty));
router.post('/students/bulk', asyncHandler(adminController.createStudentBatch));

module.exports = router;
