const { sql, poolPromise } = require('../database/db');

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;

        const cartResult = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT * FROM carts WHERE customer_id = @customer_id');

        const cart = cartResult.recordset[0];
        if (!cart) {
            return res.status(200).json({ success: true, data: { items: [] } });
        }

        const itemsResult = await pool.request()
            .input('cart_id', sql.UniqueIdentifier, cart.cart_id)
            .query(`
                SELECT ci.*, p.name, p.base_price, 
                (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1) as image_url
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.product_id
                WHERE ci.cart_id = @cart_id
            `);

        res.status(200).json({
            success: true,
            data: {
                ...cart,
                items: itemsResult.recordset
            }
        });

    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, variant_id, quantity = 1 } = req.body;

        const pool = await poolPromise;

        // Get or create cart
        let cartResult = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT cart_id FROM carts WHERE customer_id = @customer_id');

        let cartId;
        if (cartResult.recordset.length === 0) {
            const newCartId = sql.UniqueIdentifier; // Should use uuid or let SQL handle it
            const insertCart = await pool.request()
                .input('customer_id', sql.UniqueIdentifier, userId)
                .query('INSERT INTO carts (customer_id) OUTPUT INSERTED.cart_id VALUES (@customer_id)');
            cartId = insertCart.recordset[0].cart_id;
        } else {
            cartId = cartResult.recordset[0].cart_id;
        }

        // Check if product exists and get price
        const productResult = await pool.request()
            .input('product_id', sql.UniqueIdentifier, product_id)
            .query('SELECT base_price FROM products WHERE product_id = @product_id');

        if (productResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const unitPrice = productResult.recordset[0].base_price;

        // Check if item already in cart
        const itemResult = await pool.request()
            .input('cart_id', sql.UniqueIdentifier, cartId)
            .input('product_id', sql.UniqueIdentifier, product_id)
            .query('SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = @cart_id AND product_id = @product_id');

        if (itemResult.recordset.length > 0) {
            // Update quantity
            await pool.request()
                .input('cart_item_id', sql.UniqueIdentifier, itemResult.recordset[0].cart_item_id)
                .input('quantity', sql.Int, itemResult.recordset[0].quantity + quantity)
                .query('UPDATE cart_items SET quantity = @quantity WHERE cart_item_id = @cart_item_id');
        } else {
            // Insert new item
            await pool.request()
                .input('cart_id', sql.UniqueIdentifier, cartId)
                .input('product_id', sql.UniqueIdentifier, product_id)
                .input('variant_id', sql.UniqueIdentifier, variant_id || null)
                .input('quantity', sql.Int, quantity)
                .input('unit_price', sql.Decimal, unitPrice)
                .query('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price) VALUES (@cart_id, @product_id, @variant_id, @quantity, @unit_price)');
        }

        res.status(201).json({ success: true, message: 'Item added to cart' });

    } catch (error) {
        console.error('Add To Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('cart_item_id', sql.UniqueIdentifier, itemId)
            .input('quantity', sql.Int, quantity)
            .query('UPDATE cart_items SET quantity = @quantity WHERE cart_item_id = @cart_item_id');

        res.status(200).json({ success: true, message: 'Cart item updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('cart_item_id', sql.UniqueIdentifier, itemId)
            .query('DELETE FROM cart_items WHERE cart_item_id = @cart_item_id');

        res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;

        const cartResult = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT cart_id FROM carts WHERE customer_id = @customer_id');

        if (cartResult.recordset.length > 0) {
            await pool.request()
                .input('cart_id', sql.UniqueIdentifier, cartResult.recordset[0].cart_id)
                .query('DELETE FROM cart_items WHERE cart_id = @cart_id');
        }

        res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
