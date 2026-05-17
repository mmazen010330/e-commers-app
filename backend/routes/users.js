const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// GET /api/users/me - Get current user profile
router.get('/me', userController.getProfile);

// PUT /api/users/me - Update profile
router.put('/me', userController.updateProfile);

// GET /api/users/me/addresses - List addresses
router.get('/me/addresses', userController.getAddresses);

// POST /api/users/me/addresses - Add address
router.post('/me/addresses', userController.addAddress);

// PUT /api/users/me/addresses/:id - Update address
router.put('/me/addresses/:id', userController.updateAddress);

// DELETE /api/users/me/addresses/:id - Delete address
router.delete('/me/addresses/:id', userController.deleteAddress);

// PUT /api/users/me/addresses/:id/default - Set default address
router.put('/me/addresses/:id/default', userController.setDefaultAddress);

module.exports = router;
