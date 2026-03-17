const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(dashboardController.showDashboard));

module.exports = router;
