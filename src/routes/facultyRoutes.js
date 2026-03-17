const express = require('express');

const facultyController = require('../controllers/facultyController');
const asyncHandler = require('../middleware/asyncHandler');
const { ensureRole } = require('../middleware/auth');

const router = express.Router();

router.use(ensureRole('FACULTY'));
router.get('/attendance', asyncHandler(facultyController.showAttendance));
router.post('/attendance', asyncHandler(facultyController.saveAttendance));
router.get('/grades', asyncHandler(facultyController.showGrades));
router.post('/grades/components', asyncHandler(facultyController.addComponent));
router.post('/grades/marks', asyncHandler(facultyController.saveMarks));
router.post('/grades/final', asyncHandler(facultyController.publishGrades));

module.exports = router;
