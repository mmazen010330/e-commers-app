const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['admin']));

// GET /api/admin/dashboard - Get platform stats
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/users - List all users
router.get('/users', adminController.getUsers);

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', adminController.updateUserRole);

// PUT /api/admin/users/:id/suspend - Suspend user
router.put('/users/:id/suspend', adminController.suspendUser);

// GET /api/admin/sellers/pending - Seller verification queue
router.get('/sellers/pending', adminController.getPendingSellers);

// PUT /api/admin/sellers/:id/verify - Approve/reject seller
router.put('/sellers/:id/verify', adminController.verifySeller);

// GET /api/admin/coupons - List all coupons
router.get('/coupons', adminController.getCoupons);

// GET /api/admin/orders/pending - Get COD pending orders
router.get('/orders/pending', adminController.getPendingCodOrders);

// PUT /api/admin/orders/:id/confirm - Confirm COD order
router.put('/orders/:id/confirm', adminController.confirmCodOrder);

// POST /api/admin/coupons - Create coupon code
router.post('/coupons', adminController.createCoupon);

module.exports = router;
