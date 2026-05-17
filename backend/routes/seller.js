const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['seller']));

// GET /api/seller/dashboard - Get seller stats
router.get('/dashboard', sellerController.getDashboard);

// GET /api/seller/products - List seller products
router.get('/products', sellerController.getProducts);

// POST /api/seller/products - Create new product
router.post('/products', sellerController.createProduct);

// PUT /api/seller/products/:id - Update product
router.put('/products/:id', sellerController.updateProduct);

// DELETE /api/seller/products/:id - Delete product
router.delete('/products/:id', sellerController.deleteProduct);

// GET /api/seller/orders - List seller orders
router.get('/orders', sellerController.getOrders);

// PUT /api/seller/orders/:id/status - Update fulfillment status
router.put('/orders/:id/status', sellerController.updateOrderStatus);

// GET /api/seller/earnings - View earnings and payouts
router.get('/earnings', sellerController.getEarnings);

module.exports = router;
