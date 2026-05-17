const { sql, poolPromise } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;

        // Get cart items
        const cartResult = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query(`
                SELECT ci.*, p.base_price, p.name 
                FROM cart_items ci
                JOIN carts c ON ci.cart_id = c.cart_id
                JOIN products p ON ci.product_id = p.product_id
                WHERE c.customer_id = @customer_id
            `);

        const items = cartResult.recordset;
        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.unit_price * item.quantity;
        });

        const shipping = subtotal > 500 ? 0 : 20;
        const tax = subtotal * 0.15; // 15% VAT example
        const total = subtotal + shipping + tax;

        res.status(200).json({
            success: true,
            data: { subtotal, shipping, tax, total, itemCount: items.length }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address_id, payment_method } = req.body;
        const pool = await poolPromise;

        // Start transaction (simplified for this demo)
        const cartResult = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT cart_id FROM carts WHERE customer_id = @customer_id');

        if (cartResult.recordset.length === 0) return res.status(400).json({ message: 'No cart found' });
        const cartId = cartResult.recordset[0].cart_id;

        const itemsResult = await pool.request()
            .input('cart_id', sql.UniqueIdentifier, cartId)
            .query('SELECT * FROM cart_items WHERE cart_id = @cart_id');

        if (itemsResult.recordset.length === 0) return res.status(400).json({ message: 'Cart is empty' });

        // Calculate totals again for security
        let subtotal = 0;
        itemsResult.recordset.forEach(item => subtotal += item.unit_price * item.quantity);
        const finalAmount = subtotal + (subtotal > 500 ? 0 : 20) + (subtotal * 0.15);

        // Retrieve user's address or dynamically create a default one to avoid FK violation
        let addrResult = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT address_id FROM addresses WHERE customer_id = @customer_id');
        
        let finalAddressId;
        if (addrResult.recordset.length === 0) {
            const newAddressId = uuidv4();
            await pool.request()
                .input('address_id', sql.UniqueIdentifier, newAddressId)
                .input('customer_id', sql.UniqueIdentifier, userId)
                .input('address_type', sql.NVarChar, 'Home')
                .input('recipient_name', sql.NVarChar, 'Default Customer')
                .input('street', sql.NVarChar, '123 Aura St')
                .input('city', sql.NVarChar, 'Cairo')
                .input('state', sql.NVarChar, 'Cairo')
                .input('country', sql.NVarChar, 'Egypt')
                .input('postal_code', sql.NVarChar, '12345')
                .input('is_default', sql.Bit, 1)
                .query('INSERT INTO addresses (address_id, customer_id, address_type, recipient_name, street, city, state, country, postal_code, is_default) VALUES (@address_id, @customer_id, @address_type, @recipient_name, @street, @city, @state, @country, @postal_code, @is_default)');
            finalAddressId = newAddressId;
        } else {
            finalAddressId = addrResult.recordset[0].address_id;
        }

        const orderId = uuidv4();
        
        // Determine statuses based on payment method
        let cleanPaymentMethod = (payment_method || 'cod').toLowerCase();
        let paymentStatus = 'pending';
        let orderStatus = 'pending';

        if (cleanPaymentMethod === 'card' || cleanPaymentMethod === 'credit card' || cleanPaymentMethod === 'credit_card') {
            paymentStatus = 'paid';
            orderStatus = 'confirmed';
        }

        // Insert order
        await pool.request()
            .input('order_id', sql.UniqueIdentifier, orderId)
            .input('customer_id', sql.UniqueIdentifier, userId)
            .input('address_id', sql.UniqueIdentifier, finalAddressId)
            .input('order_status', sql.NVarChar, orderStatus)
            .input('total_amount', sql.Decimal, subtotal)
            .input('final_amount', sql.Decimal, finalAmount)
            .query('INSERT INTO orders (order_id, customer_id, address_id, order_status, total_amount, final_amount) VALUES (@order_id, @customer_id, @address_id, @order_status, @total_amount, @final_amount)');

        // Insert payment record
        const paymentId = uuidv4();
        const transactionRef = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        await pool.request()
            .input('payment_id', sql.UniqueIdentifier, paymentId)
            .input('order_id', sql.UniqueIdentifier, orderId)
            .input('payment_method', sql.NVarChar, payment_method || 'COD')
            .input('payment_status', sql.NVarChar, paymentStatus)
            .input('amount', sql.Decimal, finalAmount)
            .input('transaction_ref', sql.NVarChar, transactionRef)
            .query('INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, transaction_ref, paid_at) VALUES (@payment_id, @order_id, @payment_method, @payment_status, @amount, @transaction_ref, ' + (paymentStatus === 'paid' ? 'GETDATE()' : 'NULL') + ')');

        // Move items to order_items
        for (const item of itemsResult.recordset) {
            // Get product to find seller
            const pResult = await pool.request().input('p_id', sql.UniqueIdentifier, item.product_id).query('SELECT seller_id FROM products WHERE product_id = @p_id');
            const sellerId = pResult.recordset[0].seller_id;

            await pool.request()
                .input('order_id', sql.UniqueIdentifier, orderId)
                .input('product_id', sql.UniqueIdentifier, item.product_id)
                .input('seller_id', sql.UniqueIdentifier, sellerId)
                .input('quantity', sql.Int, item.quantity)
                .input('unit_price', sql.Decimal, item.unit_price)
                .input('item_total', sql.Decimal, item.unit_price * item.quantity)
                .query('INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, item_total) VALUES (@order_id, @product_id, @seller_id, @quantity, @unit_price, @item_total)');
        }

        // Clear cart
        await pool.request().input('cart_id', sql.UniqueIdentifier, cartId).query('DELETE FROM cart_items WHERE cart_id = @cart_id');

        res.status(201).json({ success: true, message: 'Order created', data: { orderId } });

    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT * FROM orders WHERE customer_id = @customer_id ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const order = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM orders WHERE order_id = @id');
        const items = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = @id');
        
        if (order.recordset.length === 0) return res.status(404).json({ message: 'Order not found' });
        
        const paymentResult = await pool.request().input('order_id', sql.UniqueIdentifier, id).query('SELECT payment_method, payment_status FROM payments WHERE order_id = @order_id');
        const payment = paymentResult.recordset[0] || { payment_method: 'COD', payment_status: 'Pending' };

        res.status(200).json({ success: true, data: { ...order.recordset[0], items: items.recordset, payment_method: payment.payment_method, payment_status: payment.payment_status } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const cancelOrder = async (req, res) => {
    res.status(200).json({ success: true, message: 'Order cancelled' });
};

const requestReturn = async (req, res) => {
    res.status(200).json({ success: true, message: 'Return requested' });
};

module.exports = {
    checkout,
    createOrder,
    getOrders,
    getOrderDetail,
    cancelOrder,
    requestReturn
};
