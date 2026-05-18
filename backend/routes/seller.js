const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const offerController  = require('../controllers/offerController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['seller']));

// ── Dashboard ──────────────────────────────────────
router.get('/dashboard', sellerController.getDashboard);

// ── Products ───────────────────────────────────────
router.get('/products',     sellerController.getProducts);
router.post('/products',    sellerController.createProduct);
router.put('/products/:id', sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);

// ── Orders ─────────────────────────────────────────
router.get('/orders',              sellerController.getOrders);
router.put('/orders/:id/status',   sellerController.updateOrderStatus);

// ── Earnings ───────────────────────────────────────
router.get('/earnings', sellerController.getEarnings);

// ── Offers ─────────────────────────────────────────
// GET  /api/seller/offers         – list seller's own offers
// POST /api/seller/offers         – submit a new offer (pending admin approval)
// DELETE /api/seller/offers/:id   – withdraw a pending offer
router.get('/offers',        offerController.getSellerOffers);
router.post('/offers',       offerController.createOffer);
router.delete('/offers/:id', offerController.deleteOffer);

module.exports = router;

