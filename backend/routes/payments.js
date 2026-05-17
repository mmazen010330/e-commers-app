const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Stripe
router.post('/stripe/intent', verifyToken, paymentController.createStripeIntent);
router.post('/stripe/webhook', paymentController.handleStripeWebhook);

// PayPal
router.post('/paypal/create', verifyToken, paymentController.createPayPalOrder);
router.post('/paypal/capture', verifyToken, paymentController.capturePayPalPayment);

// COD
router.post('/cod', verifyToken, paymentController.processCOD);

// Refund
router.post('/:id/refund', verifyToken, paymentController.processRefund);

module.exports = router;
