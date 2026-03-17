const express = require('express');

const placementController = require('../controllers/placementController');
const asyncHandler = require('../middleware/asyncHandler');
const { ensureRole } = require('../middleware/auth');

const router = express.Router();

router.use(ensureRole('STUDENT'));
router.get('/', asyncHandler(placementController.showPlacementBoard));
router.post('/apply', asyncHandler(placementController.apply));

module.exports = router;
