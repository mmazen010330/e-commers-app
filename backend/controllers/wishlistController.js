const { sql, poolPromise } = require('../database/db');

const getWishlist = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const addToWishlist = async (req, res) => {
    res.status(201).json({ success: true, message: 'Added to wishlist' });
};

const removeFromWishlist = async (req, res) => {
    res.status(200).json({ success: true, message: 'Removed from wishlist' });
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
