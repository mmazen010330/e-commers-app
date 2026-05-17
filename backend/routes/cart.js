const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// All cart routes require authentication
router.use(verifyToken);

// GET /api/cart - Get current cart
router.get('/', cartController.getCart);

// POST /api/cart - Add item to cart
router.post('/', cartController.addToCart);

// PUT /api/cart/:itemId - Update item quantity
router.put('/:itemId', cartController.updateCartItem);

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', cartController.removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', cartController.clearCart);

module.exports = router;
