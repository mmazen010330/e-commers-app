const { sql, poolPromise } = require('../database/db');

const getDashboard = async (req, res) => {
    res.status(200).json({ success: true, data: { stats: {} } });
};

const getUsers = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const updateUserRole = async (req, res) => {
    res.status(200).json({ success: true, message: 'Role updated' });
};

const suspendUser = async (req, res) => {
    res.status(200).json({ success: true, message: 'User suspended' });
};

const getPendingSellers = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const verifySeller = async (req, res) => {
    res.status(200).json({ success: true, message: 'Seller verified' });
};

const getCoupons = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const createCoupon = async (req, res) => {
    res.status(201).json({ success: true, message: 'Coupon created' });
};

const getPendingCodOrders = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT o.order_id, o.customer_id, o.final_amount, o.order_status, o.created_at,
                       p.payment_method, p.payment_status, u.full_name as customer_name
                FROM orders o
                INNER JOIN payments p ON o.order_id = p.order_id
                INNER JOIN users u ON o.customer_id = u.user_id
                WHERE (p.payment_method = 'cod' OR p.payment_method = 'COD')
                  AND p.payment_status = 'pending'
                ORDER BY o.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const confirmCodOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('order_id', sql.UniqueIdentifier, id)
            .query(`
                UPDATE payments
                SET payment_status = 'paid', paid_at = GETDATE()
                WHERE order_id = @order_id;

                UPDATE orders
                SET order_status = 'confirmed'
                WHERE order_id = @order_id;
            `);
        res.status(200).json({ success: true, message: 'COD Order confirmed and marked as Paid successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getDashboard,
    getUsers,
    updateUserRole,
    suspendUser,
    getPendingSellers,
    verifySeller,
    getCoupons,
    createCoupon,
    getPendingCodOrders,
    confirmCodOrder
};
