const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// POST /api/checkout - Validate cart, calculate totals
router.post('/checkout', orderController.checkout);

// POST /api/orders - Create order from checkout
router.post('/', orderController.createOrder);

// GET /api/orders - List user orders
router.get('/', orderController.getOrders);

// GET /api/orders/:id - Get order detail with tracking
router.get('/:id', orderController.getOrderDetail);

// PUT /api/orders/:id/cancel - Cancel pending order
router.put('/:id/cancel', orderController.cancelOrder);

// POST /api/orders/:id/return - Request return/refund
router.post('/:id/return', orderController.requestReturn);

module.exports = router;
