const { sql, poolPromise } = require('../database/db');

const getDashboard = async (req, res) => {
    res.status(200).json({ success: true, data: { stats: {} } });
};

const getProducts = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const createProduct = async (req, res) => {
    res.status(201).json({ success: true, message: 'Product created' });
};

const updateProduct = async (req, res) => {
    res.status(200).json({ success: true, message: 'Product updated' });
};

const deleteProduct = async (req, res) => {
    res.status(200).json({ success: true, message: 'Product deleted' });
};

const getOrders = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const updateOrderStatus = async (req, res) => {
    res.status(200).json({ success: true, message: 'Status updated' });
};

const getEarnings = async (req, res) => {
    res.status(200).json({ success: true, data: { total: 0 } });
};

module.exports = {
    getDashboard,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    updateOrderStatus,
    getEarnings
};
