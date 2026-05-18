const { sql, poolPromise } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────
// GET /api/admin/dashboard
// ─────────────────────────────────────────────
const getDashboard = async (req, res) => {
    try {
        const pool = await poolPromise;

        const usersRes    = await pool.request().query('SELECT COUNT(*) as c FROM users');
        const sellersRes  = await pool.request().query('SELECT COUNT(*) as c FROM sellers');
        const productsRes = await pool.request().query('SELECT COUNT(*) as c FROM products');
        const ordersRes   = await pool.request().query('SELECT COUNT(*) as c FROM orders');
        const revenueRes  = await pool.request().query("SELECT COALESCE(SUM(final_amount),0) as c FROM orders WHERE order_status NOT IN ('cancelled','refunded')");
        const pendSelRes  = await pool.request().query("SELECT COUNT(*) as c FROM sellers WHERE verification_status = 'pending'");
        const pendProdRes = await pool.request().query('SELECT COUNT(*) as c FROM products WHERE is_active = 0');
        const pendOfrRes  = await pool.request().query("SELECT COUNT(*) as c FROM seller_offers WHERE status = 'pending'");

        res.status(200).json({
            success: true,
            data: {
                totalUsers:       usersRes.recordset[0].c,
                totalSellers:     sellersRes.recordset[0].c,
                totalProducts:    productsRes.recordset[0].c,
                totalOrders:      ordersRes.recordset[0].c,
                totalRevenue:     revenueRes.recordset[0].c,
                pendingSellers:   pendSelRes.recordset[0].c,
                pendingProducts:  pendProdRes.recordset[0].c,
                pendingOffers:    pendOfrRes.recordset[0].c
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────
const getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT user_id, email, full_name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/users/:id/role
// ─────────────────────────────────────────────
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['customer','seller','admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role. Must be customer, seller, or admin.' });
        }
        const pool = await poolPromise;
        await pool.request()
            .input('user_id', sql.UniqueIdentifier, id)
            .input('role',    sql.NVarChar, role)
            .query('UPDATE users SET role = @role WHERE user_id = @user_id');
        res.status(200).json({ success: true, message: `User role updated to ${role} successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/users/:id/suspend
// ─────────────────────────────────────────────
const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('user_id',   sql.UniqueIdentifier, id)
            .input('is_active', sql.Bit, is_active ? 1 : 0)
            .query('UPDATE users SET is_active = @is_active WHERE user_id = @user_id');
        res.status(200).json({ success: true, message: is_active ? 'User account reactivated.' : 'User account suspended.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/sellers/pending
// ─────────────────────────────────────────────
const getPendingSellers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT s.*, u.full_name, u.email as user_email, u.is_active
                FROM sellers s
                JOIN users u ON s.seller_id = u.user_id
                WHERE s.verification_status = 'pending'
                ORDER BY s.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/sellers
// ─────────────────────────────────────────────
const getSellers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT s.*, u.full_name, u.email as user_email, u.is_active,
                       (SELECT COUNT(*) FROM products p WHERE p.seller_id = s.seller_id) as product_count
                FROM sellers s
                JOIN users u ON s.seller_id = u.user_id
                ORDER BY s.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/sellers/:id/verify  – approve a seller
// ─────────────────────────────────────────────
const verifySeller = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('seller_id', sql.UniqueIdentifier, id)
            .query("UPDATE sellers SET verification_status = 'verified' WHERE seller_id = @seller_id");

        // Auto-activate any pending products from this seller once verified
        await pool.request()
            .input('seller_id', sql.UniqueIdentifier, id)
            .query("UPDATE products SET is_active = 1 WHERE seller_id = @seller_id AND is_active = 0");

        res.status(200).json({ success: true, message: 'Seller approved and verified! Their pending products are now live.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/sellers/:id/reject  – reject a seller
// ─────────────────────────────────────────────
const rejectSeller = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('seller_id', sql.UniqueIdentifier, id)
            .query("UPDATE sellers SET verification_status = 'pending', can_sell = 0, can_make_offers = 0 WHERE seller_id = @seller_id");
        res.status(200).json({ success: true, message: 'Seller rejected. Selling and offer privileges revoked.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/sellers/:id/permissions
// Body: { can_sell, can_make_offers, can_edit_products }
// ─────────────────────────────────────────────
const updateSellerPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { can_sell, can_make_offers, can_edit_products } = req.body;
        const toBit = v => (v === true || v === 1 || v === 'true') ? 1 : 0;

        const pool = await poolPromise;
        await pool.request()
            .input('seller_id',       sql.UniqueIdentifier, id)
            .input('can_sell',        sql.Bit, toBit(can_sell))
            .input('can_make_offers', sql.Bit, toBit(can_make_offers))
            .input('can_edit_products', sql.Bit, toBit(can_edit_products))
            .query(`
                UPDATE sellers
                SET can_sell = @can_sell,
                    can_make_offers = @can_make_offers,
                    can_edit_products = @can_edit_products
                WHERE seller_id = @seller_id
            `);
        res.status(200).json({ success: true, message: 'Seller permissions updated successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/products/pending
// ─────────────────────────────────────────────
const getPendingProducts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT p.*, c.category_name, s.business_name,
                       (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1) as primary_image
                FROM products p
                JOIN categories c ON p.category_id = c.category_id
                JOIN sellers s    ON p.seller_id    = s.seller_id
                WHERE p.is_active = 0
                ORDER BY p.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/products  – Admin sees all products (live + pending)
// ─────────────────────────────────────────────
const getAllProducts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT p.*, c.category_name, s.business_name,
                       (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1) as primary_image
                FROM products p
                JOIN categories c ON p.category_id = c.category_id
                JOIN sellers s ON p.seller_id = s.seller_id
                ORDER BY p.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/products/:id/approve
// ─────────────────────────────────────────────
const approveProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('product_id', sql.UniqueIdentifier, id)
            .query('UPDATE products SET is_active = 1 WHERE product_id = @product_id');
        res.status(200).json({ success: true, message: 'Product approved and is now live!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/admin/products  – Admin adds a product directly
// ─────────────────────────────────────────────
const addProduct = async (req, res) => {
    try {
        const { name, sku, description, base_price, stock_quantity, brand,
                weight_kg, category_id, seller_id, image_url, is_offer, is_factory, offer_price } = req.body;

        if (!name || !base_price || !category_id || !seller_id) {
            return res.status(400).json({ success: false, message: 'name, base_price, category_id and seller_id are required.' });
        }

        const pool      = await poolPromise;
        const productId = uuidv4();
        const resolvedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 5);
        const resolvedSku  = sku || 'SKU-A-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const toBit = v => (v === true || v === 1 || v === 'true') ? 1 : 0;

        await pool.request()
            .input('product_id',    sql.UniqueIdentifier, productId)
            .input('seller_id',     sql.UniqueIdentifier, seller_id)
            .input('category_id',   sql.UniqueIdentifier, category_id)
            .input('sku',           sql.NVarChar, resolvedSku)
            .input('name',          sql.NVarChar, name)
            .input('slug',          sql.NVarChar, resolvedSlug)
            .input('description',   sql.NVarChar, description || null)
            .input('base_price',    sql.Decimal,  parseFloat(base_price))
            .input('stock_quantity',sql.Int,      parseInt(stock_quantity) || 0)
            .input('brand',         sql.NVarChar, brand || null)
            .input('weight_kg',     sql.Decimal,  weight_kg || null)
            .input('is_active',     sql.Bit,      1)   // Admin-added products go live immediately
            .input('is_offer',      sql.Bit,      toBit(is_offer))
            .input('is_factory',    sql.Bit,      toBit(is_factory))
            .input('offer_price',   sql.Decimal,  offer_price ? parseFloat(offer_price) : null)
            .query(`
                INSERT INTO products
                    (product_id, seller_id, category_id, sku, name, slug, description,
                     base_price, stock_quantity, brand, weight_kg, is_active, is_offer, is_factory, offer_price)
                VALUES
                    (@product_id, @seller_id, @category_id, @sku, @name, @slug, @description,
                     @base_price, @stock_quantity, @brand, @weight_kg, @is_active, @is_offer, @is_factory, @offer_price)
            `);

        if (image_url) {
            await pool.request()
                .input('image_id',  sql.UniqueIdentifier, uuidv4())
                .input('product_id',sql.UniqueIdentifier, productId)
                .input('image_url', sql.NVarChar, image_url)
                .query('INSERT INTO product_images (image_id, product_id, image_url, is_primary) VALUES (@image_id, @product_id, @image_url, 1)');
        }

        res.status(201).json({ success: true, message: 'Product added by admin and is now live!', data: { product_id: productId } });
    } catch (err) {
        console.error('Admin Add Product Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/products/:id  – Admin edits any product
// ─────────────────────────────────────────────
const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, base_price, stock_quantity, brand, weight_kg,
                category_id, is_offer, is_factory, offer_price, description, is_active, image_url } = req.body;
        const pool  = await poolPromise;
        const toBit = v => (v === true || v === 1 || v === 'true') ? 1 : 0;

        await pool.request()
            .input('product_id',    sql.UniqueIdentifier, id)
            .input('category_id',   sql.UniqueIdentifier, category_id)
            .input('name',          sql.NVarChar, name)
            .input('description',   sql.NVarChar, description || null)
            .input('base_price',    sql.Decimal,  parseFloat(base_price))
            .input('stock_quantity',sql.Int,      parseInt(stock_quantity))
            .input('brand',         sql.NVarChar, brand || null)
            .input('weight_kg',     sql.Decimal,  weight_kg || null)
            .input('is_offer',      sql.Bit,      toBit(is_offer))
            .input('is_factory',    sql.Bit,      toBit(is_factory))
            .input('offer_price',   sql.Decimal,  offer_price ? parseFloat(offer_price) : null)
            .input('is_active',     sql.Bit,      is_active !== undefined ? toBit(is_active) : 1)
            .query(`
                UPDATE products
                SET name = @name,
                    category_id = @category_id,
                    description = @description,
                    base_price = @base_price,
                    stock_quantity = @stock_quantity,
                    brand = @brand,
                    weight_kg = @weight_kg,
                    is_offer = @is_offer,
                    is_factory = @is_factory,
                    offer_price = @offer_price,
                    is_active = @is_active
                WHERE product_id = @product_id
            `);

        if (image_url) {
            const imgCheck = await pool.request()
                .input('product_id', sql.UniqueIdentifier, id)
                .query('SELECT image_id FROM product_images WHERE product_id = @product_id AND is_primary = 1');
            if (imgCheck.recordset.length > 0) {
                await pool.request()
                    .input('product_id', sql.UniqueIdentifier, id)
                    .input('image_url',  sql.NVarChar, image_url)
                    .query('UPDATE product_images SET image_url = @image_url WHERE product_id = @product_id AND is_primary = 1');
            } else {
                await pool.request()
                    .input('image_id',  sql.UniqueIdentifier, uuidv4())
                    .input('product_id',sql.UniqueIdentifier, id)
                    .input('image_url', sql.NVarChar, image_url)
                    .query('INSERT INTO product_images (image_id, product_id, image_url, is_primary) VALUES (@image_id, @product_id, @image_url, 1)');
            }
        }

        res.status(200).json({ success: true, message: 'Product updated by Administrator!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/products/:id
// ─────────────────────────────────────────────
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('product_id', sql.UniqueIdentifier, id)
            .query('DELETE FROM products WHERE product_id = @product_id');
        res.status(200).json({ success: true, message: 'Product permanently deleted by Administrator.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET  /api/admin/coupons
// POST /api/admin/coupons
// ─────────────────────────────────────────────
const getCoupons = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM coupons ORDER BY starts_at DESC');
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const createCoupon = async (req, res) => {
    try {
        const { code, type, value, min_order_amount, max_discount, usage_limit, starts_at, expires_at } = req.body;
        if (!code || !type || !value || !starts_at || !expires_at) {
            return res.status(400).json({ success: false, message: 'code, type, value, starts_at and expires_at are required.' });
        }
        const pool = await poolPromise;
        await pool.request()
            .input('coupon_id',       sql.UniqueIdentifier, uuidv4())
            .input('code',            sql.NVarChar, code.toUpperCase())
            .input('type',            sql.NVarChar, type)
            .input('value',           sql.Decimal,  parseFloat(value))
            .input('min_order_amount',sql.Decimal,  min_order_amount || null)
            .input('max_discount',    sql.Decimal,  max_discount || null)
            .input('usage_limit',     sql.Int,      usage_limit || null)
            .input('starts_at',       sql.DateTime, new Date(starts_at))
            .input('expires_at',      sql.DateTime, new Date(expires_at))
            .query(`
                INSERT INTO coupons (coupon_id, code, type, value, min_order_amount, max_discount, usage_limit, starts_at, expires_at)
                VALUES (@coupon_id, @code, @type, @value, @min_order_amount, @max_discount, @usage_limit, @starts_at, @expires_at)
            `);
        res.status(201).json({ success: true, message: `Coupon ${code.toUpperCase()} created successfully!` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/orders/pending  (COD queue)
// ─────────────────────────────────────────────
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
                INNER JOIN users u   ON o.customer_id = u.user_id
                WHERE (p.payment_status = 'pending' OR p.payment_status IS NULL)
                  AND o.order_status = 'pending'
                ORDER BY o.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/orders/:id/confirm
// ─────────────────────────────────────────────
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
                    UPDATE payments SET payment_status = 'paid', paid_at = GETDATE() WHERE order_id = @order_id;
                END
                UPDATE orders SET order_status = 'confirmed' WHERE order_id = @order_id;
            `);
        res.status(200).json({ success: true, message: 'COD Order confirmed and marked as Paid!' });
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
    getSellers,
    verifySeller,
    rejectSeller,
    updateSellerPermissions,
    getPendingProducts,
    getAllProducts,
    approveProduct,
    addProduct,
    editProduct,
    deleteProduct,
    getCoupons,
    createCoupon,
    getPendingCodOrders,
    confirmCodOrder
};
