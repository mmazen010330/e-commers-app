const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const offerController  = require('../controllers/offerController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['admin']));

// ── Dashboard ──────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ── Users ──────────────────────────────────────────────────────
router.get('/users',               adminController.getUsers);
router.put('/users/:id/role',      adminController.updateUserRole);
router.put('/users/:id/suspend',   adminController.suspendUser);

// ── Sellers ────────────────────────────────────────────────────
router.get('/sellers/pending',         adminController.getPendingSellers);
router.get('/sellers',                 adminController.getSellers);
router.put('/sellers/:id/permissions', adminController.updateSellerPermissions);
router.put('/sellers/:id/verify',      adminController.verifySeller);
router.put('/sellers/:id/reject',      adminController.rejectSeller);

// ── Products ───────────────────────────────────────────────────
router.get('/products/pending',     adminController.getPendingProducts);
router.get('/products',             adminController.getAllProducts);
router.put('/products/:id/approve', adminController.approveProduct);
router.post('/products',            adminController.addProduct);     // Admin direct add
router.put('/products/:id',         adminController.editProduct);
router.delete('/products/:id',      adminController.deleteProduct);

// ── Offers ─────────────────────────────────────────────────────
router.get('/offers/pending',     offerController.getPendingOffers);
router.get('/offers',             offerController.getAllOffers);
router.put('/offers/:id/approve', offerController.approveOffer);
router.put('/offers/:id/reject',  offerController.rejectOffer);

// ── Coupons ────────────────────────────────────────────────────
router.get('/coupons',  adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);

// ── Orders ─────────────────────────────────────────────────────
router.get('/orders/pending',    adminController.getPendingCodOrders);
router.put('/orders/:id/confirm',adminController.confirmCodOrder);

module.exports = router;
