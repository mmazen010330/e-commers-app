const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createStripeIntent = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // in cents
            currency: 'usd',
            metadata: { orderId }
        });
        res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleStripeWebhook = async (req, res) => {
    // Stripe webhook logic
    res.status(200).send({ received: true });
};

const createPayPalOrder = async (req, res) => {
    res.status(200).json({ success: true, message: 'PayPal order created' });
};

const capturePayPalPayment = async (req, res) => {
    res.status(200).json({ success: true, message: 'PayPal payment captured' });
};

const processCOD = async (req, res) => {
    res.status(200).json({ success: true, message: 'COD order placed' });
};

const processRefund = async (req, res) => {
    res.status(200).json({ success: true, message: 'Refund processed' });
};

module.exports = {
    createStripeIntent,
    handleStripeWebhook,
    createPayPalOrder,
    capturePayPalPayment,
    processCOD,
    processRefund
};
