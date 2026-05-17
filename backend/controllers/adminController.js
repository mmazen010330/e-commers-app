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
                       COALESCE(p.payment_method, 'COD') as payment_method,
                       COALESCE(p.payment_status, 'pending') as payment_status,
                       u.full_name as customer_name
                FROM orders o
                LEFT JOIN payments p ON o.order_id = p.order_id
                INNER JOIN users u ON o.customer_id = u.user_id
                WHERE (p.payment_status = 'pending' OR p.payment_status IS NULL)
                  AND o.order_status = 'pending'
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
                IF NOT EXISTS (SELECT 1 FROM payments WHERE order_id = @order_id)
                BEGIN
                    DECLARE @final_amount DECIMAL(12,2);
                    SELECT @final_amount = final_amount FROM orders WHERE order_id = @order_id;
                    
                    INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, transaction_ref, paid_at)
                    VALUES (NEWID(), @order_id, 'COD', 'paid', @final_amount, 'TXN-AUTO-' + REPLACE(CAST(NEWID() AS VARCHAR(50)), '-', ''), GETDATE());
                END
                ELSE
                BEGIN
                    UPDATE payments
                    SET payment_status = 'paid', paid_at = GETDATE()
                    WHERE order_id = @order_id;
                END

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
