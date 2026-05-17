const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// GET /api/wishlist - Get user wishlist
router.get('/', wishlistController.getWishlist);

// POST /api/wishlist - Add item to wishlist
router.post('/', wishlistController.addToWishlist);

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;
