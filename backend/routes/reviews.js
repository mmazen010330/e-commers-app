const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/reviews - Create review (verified purchase only)
router.post('/', verifyToken, reviewController.createReview);

// GET /api/products/:id/reviews - List product reviews
router.get('/product/:id', reviewController.getProductReviews);

// PUT /api/reviews/:id/helpful - Mark review helpful
router.put('/:id/helpful', verifyToken, reviewController.markHelpful);

// POST /api/reviews/:id/response - Seller response to review
router.post('/:id/response', verifyToken, reviewController.sellerResponse);

module.exports = router;
