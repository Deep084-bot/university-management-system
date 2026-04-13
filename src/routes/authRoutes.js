const express = require('express');

const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/login', ensureGuest, asyncHandler(authController.showLogin));
router.post('/login', ensureGuest, asyncHandler(authController.login));
router.get('/change-password', ensureAuthenticated, asyncHandler(authController.showChangePassword));
router.post('/change-password', ensureAuthenticated, asyncHandler(authController.updatePassword));
router.post('/logout', ensureAuthenticated, asyncHandler(authController.logout));

module.exports = router;
