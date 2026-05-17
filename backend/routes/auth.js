const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// POST /api/auth/login - Login with JWT + refresh token
router.post('/login', authController.login);

// POST /api/auth/logout - Invalidate refresh token
router.post('/logout', verifyToken, authController.logout);

// POST /api/auth/refresh - Get new access token
router.post('/refresh', authController.refresh);

// POST /api/auth/forgot-password - Send reset email
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password - Update password with token
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/verify-email - Verify email with OTP
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/google - Google OAuth login
router.post('/google', authController.googleLogin);

// POST /api/auth/facebook - Facebook OAuth login
router.post('/facebook', authController.facebookLogin);

module.exports = router;
