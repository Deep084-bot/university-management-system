const express = require('express');

const studentController = require('../controllers/studentController');
const asyncHandler = require('../middleware/asyncHandler');
const { ensureRole } = require('../middleware/auth');

const router = express.Router();

router.use(ensureRole('STUDENT'));
router.get('/courses', asyncHandler(studentController.showCourseRegistration));
router.post('/courses/register', asyncHandler(studentController.registerCourse));

module.exports = router;
