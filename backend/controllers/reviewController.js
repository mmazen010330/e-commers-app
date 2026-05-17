const { sql, poolPromise } = require('../database/db');

const createReview = async (req, res) => {
    res.status(201).json({ success: true, message: 'Review created' });
};

const getProductReviews = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const markHelpful = async (req, res) => {
    res.status(200).json({ success: true, message: 'Marked helpful' });
};

const sellerResponse = async (req, res) => {
    res.status(200).json({ success: true, message: 'Response saved' });
};

module.exports = {
    createReview,
    getProductReviews,
    markHelpful,
    sellerResponse
};
