const { sql, poolPromise } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const extractDirectImageUrl = (url) => {
    if (!url) return url;
    try {
        const parsedUrl = new URL(url);
        // Check for Bing Images Detail URL
        if (parsedUrl.hostname.includes('bing.com') && parsedUrl.pathname.includes('/images/')) {
            const mediaUrl = parsedUrl.searchParams.get('mediaurl');
            if (mediaUrl) return decodeURIComponent(mediaUrl);
        }
        // Check for Google Images URL
        if (parsedUrl.hostname.includes('google.') && parsedUrl.pathname.includes('/imgres')) {
            const imgUrl = parsedUrl.searchParams.get('imgurl');
            if (imgUrl) return decodeURIComponent(imgUrl);
        }
        // Check for Google Search redirect link
        if (parsedUrl.hostname.includes('google.') && parsedUrl.pathname.includes('/url')) {
            const qUrl = parsedUrl.searchParams.get('url') || parsedUrl.searchParams.get('q');
            if (qUrl) return extractDirectImageUrl(decodeURIComponent(qUrl));
        }
    } catch (e) {
        // Not a valid URL or parsing failed
    }
    return url;
};

const getDashboard = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const pool = await poolPromise;
        
        // Ensure seller profile exists
        await ensureSellerProfile(pool, req.user);

        // Fetch stats
        const productCountRes = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('SELECT COUNT(*) as total FROM products WHERE seller_id = @seller_id');

        const salesCountRes = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('SELECT COUNT(DISTINCT order_id) as total FROM order_items WHERE seller_id = @seller_id');

        const earningsRes = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('SELECT SUM(item_total - commission_amount) as total FROM order_items WHERE seller_id = @seller_id AND seller_payout_status = \'paid\'');

        const profileRes = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('SELECT verification_status, can_sell, can_make_offers, can_edit_products FROM sellers WHERE seller_id = @seller_id');

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    productsCount: productCountRes.recordset[0].total || 0,
                    salesCount: salesCountRes.recordset[0].total || 0,
                    earnings: earningsRes.recordset[0].total || 0
                },
                profile: profileRes.recordset[0] || { verification_status: 'pending', can_sell: true, can_make_offers: true, can_edit_products: true }
            }
        });
    } catch (error) {
        console.error('Seller Dashboard Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const pool = await poolPromise;

        await ensureSellerProfile(pool, req.user);

        const result = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query(`
                SELECT p.*, c.category_name, 
                       (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1) as primary_image
                FROM products p
                JOIN categories c ON p.category_id = c.category_id
                WHERE p.seller_id = @seller_id
                ORDER BY p.created_at DESC
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Seller Get Products Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { 
            name, sku, slug, description, base_price, stock_quantity, 
            brand, weight_kg, category_id, 
            is_offer, is_factory, offer_price 
        } = req.body;
        const rawImageUrl = req.body.image_url;
        const image_url = extractDirectImageUrl(rawImageUrl);

        if (!name || !base_price || !category_id) {
            return res.status(400).json({ success: false, message: 'Name, Base Price and Category are required.' });
        }

        const pool = await poolPromise;
        const seller = await ensureSellerProfile(pool, req.user);

        // Check sell permission
        if (!seller.can_sell) {
            return res.status(403).json({ success: false, message: 'Your selling privileges have been suspended by the administrator.' });
        }

        // Check offer permission
        const isOfferVal = is_offer === true || is_offer === 1 || is_offer === 'true';
        if (isOfferVal && !seller.can_make_offers) {
            return res.status(403).json({ success: false, message: 'Your privilege to make special offers has been suspended by the administrator.' });
        }

        // Determine is_active based on verification status
        const isVerified = seller.verification_status === 'verified';
        const is_active = isVerified ? 1 : 0;

        const productId = uuidv4();
        const resolvedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 5);
        const resolvedSku = sku || 'SKU-S-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const isFactoryVal = is_factory === true || is_factory === 1 || is_factory === 'true';

        await pool.request()
            .input('product_id', sql.UniqueIdentifier, productId)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .input('category_id', sql.UniqueIdentifier, category_id)
            .input('sku', sql.NVarChar, resolvedSku)
            .input('name', sql.NVarChar, name)
            .input('slug', sql.NVarChar, resolvedSlug)
            .input('description', sql.NVarChar, description || null)
            .input('base_price', sql.Decimal, base_price)
            .input('stock_quantity', sql.Int, stock_quantity || 10)
            .input('brand', sql.NVarChar, brand || null)
            .input('weight_kg', sql.Decimal, weight_kg || null)
            .input('is_active', sql.Bit, is_active)
            .input('is_offer', sql.Bit, isOfferVal ? 1 : 0)
            .input('is_factory', sql.Bit, isFactoryVal ? 1 : 0)
            .input('offer_price', sql.Decimal, offer_price ? parseFloat(offer_price) : null)
            .query(`
                INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, is_offer, is_factory, offer_price)
                VALUES (@product_id, @seller_id, @category_id, @sku, @name, @slug, @description, @base_price, @stock_quantity, @brand, @weight_kg, @is_active, @is_offer, @is_factory, @offer_price)
            `);

        // If primary image provided, insert into product_images
        if (image_url) {
            const imageId = uuidv4();
            await pool.request()
                .input('image_id', sql.UniqueIdentifier, imageId)
                .input('product_id', sql.UniqueIdentifier, productId)
                .input('image_url', sql.NVarChar, image_url)
                .query(`
                    INSERT INTO product_images (image_id, product_id, image_url, is_primary)
                    VALUES (@image_id, @product_id, @image_url, 1)
                `);
        }

        res.status(201).json({ 
            success: true, 
            message: isVerified ? 'Product added successfully!' : 'Product submitted successfully and is pending administrator confirmation.', 
            data: { product_id: productId } 
        });
    } catch (error) {
        console.error('Seller Create Product Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const productId = req.params.id;
        const { 
            name, sku, description, base_price, stock_quantity, 
            brand, weight_kg, category_id, 
            is_offer, is_factory, offer_price 
        } = req.body;
        const rawImageUrl = req.body.image_url;
        const image_url = extractDirectImageUrl(rawImageUrl);

        const pool = await poolPromise;
        const seller = await ensureSellerProfile(pool, req.user);

        if (!seller.can_edit_products) {
            return res.status(403).json({ success: false, message: 'Your product editing privileges have been suspended by the administrator.' });
        }

        const isOfferVal = is_offer === true || is_offer === 1 || is_offer === 'true';
        if (isOfferVal && !seller.can_make_offers) {
            return res.status(403).json({ success: false, message: 'Your privilege to make special offers has been suspended by the administrator.' });
        }

        const isFactoryVal = is_factory === true || is_factory === 1 || is_factory === 'true';

        // Update product table
        await pool.request()
            .input('product_id', sql.UniqueIdentifier, productId)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .input('category_id', sql.UniqueIdentifier, category_id)
            .input('sku', sql.NVarChar, sku)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('base_price', sql.Decimal, base_price)
            .input('stock_quantity', sql.Int, stock_quantity)
            .input('brand', sql.NVarChar, brand || null)
            .input('weight_kg', sql.Decimal, weight_kg || null)
            .input('is_offer', sql.Bit, isOfferVal ? 1 : 0)
            .input('is_factory', sql.Bit, isFactoryVal ? 1 : 0)
            .input('offer_price', sql.Decimal, offer_price ? parseFloat(offer_price) : null)
            .query(`
                UPDATE products
                SET name = @name,
                    category_id = @category_id,
                    sku = @sku,
                    description = @description,
                    base_price = @base_price,
                    stock_quantity = @stock_quantity,
                    brand = @brand,
                    weight_kg = @weight_kg,
                    is_offer = @is_offer,
                    is_factory = @is_factory,
                    offer_price = @offer_price
                WHERE product_id = @product_id AND seller_id = @seller_id
            `);

        // Update image
        if (image_url) {
            const imgCheck = await pool.request()
                .input('product_id', sql.UniqueIdentifier, productId)
                .query('SELECT image_id FROM product_images WHERE product_id = @product_id AND is_primary = 1');
            
            if (imgCheck.recordset.length > 0) {
                await pool.request()
                    .input('product_id', sql.UniqueIdentifier, productId)
                    .input('image_url', sql.NVarChar, image_url)
                    .query('UPDATE product_images SET image_url = @image_url WHERE product_id = @product_id AND is_primary = 1');
            } else {
                await pool.request()
                    .input('image_id', sql.UniqueIdentifier, uuidv4())
                    .input('product_id', sql.UniqueIdentifier, productId)
                    .input('image_url', sql.NVarChar, image_url)
                    .query('INSERT INTO product_images (image_id, product_id, image_url, is_primary) VALUES (@image_id, @product_id, @image_url, 1)');
            }
        }

        res.status(200).json({ success: true, message: 'Product updated successfully!' });
    } catch (error) {
        console.error('Seller Update Product Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const productId = req.params.id;
        const pool = await poolPromise;
        const seller = await ensureSellerProfile(pool, req.user);

        if (!seller.can_edit_products) {
            return res.status(403).json({ success: false, message: 'Your product deletion privileges have been suspended by the administrator.' });
        }

        await pool.request()
            .input('product_id', sql.UniqueIdentifier, productId)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('DELETE FROM products WHERE product_id = @product_id AND seller_id = @seller_id');

        res.status(200).json({ success: true, message: 'Product deleted successfully!' });
    } catch (error) {
        console.error('Seller Delete Product Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrders = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query(`
                SELECT oi.*, p.name as product_name, o.created_at, o.order_status
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                JOIN orders o ON oi.order_id = o.order_id
                WHERE oi.seller_id = @seller_id
                ORDER BY o.created_at DESC
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Seller Get Orders Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const orderItemId = req.params.id;
        const { status } = req.body; // e.g. 'picked', 'shipped'

        const pool = await poolPromise;
        await pool.request()
            .input('order_item_id', sql.UniqueIdentifier, orderItemId)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .input('status', sql.NVarChar, status)
            .query('UPDATE order_items SET fulfillment_status = @status WHERE order_item_id = @order_item_id AND seller_id = @seller_id');

        res.status(200).json({ success: true, message: 'Order fulfillment status updated successfully!' });
    } catch (error) {
        console.error('Seller Update Order Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getEarnings = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query(`
                SELECT 
                    COALESCE(SUM(item_total), 0) as total_revenue,
                    COALESCE(SUM(commission_amount), 0) as platform_commission,
                    COALESCE(SUM(item_total - commission_amount), 0) as seller_earnings
                FROM order_items
                WHERE seller_id = @seller_id
            `);

        res.status(200).json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Seller Get Earnings Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to auto-create and return a seller profile if it is missing
async function ensureSellerProfile(pool, user) {
    const check = await pool.request()
        .input('seller_id', sql.UniqueIdentifier, user.id)
        .query('SELECT verification_status, can_sell, can_make_offers, can_edit_products FROM sellers WHERE seller_id = @seller_id');
    
    if (check.recordset.length > 0) {
        return check.recordset[0];
    }

    const businessName = user.name || user.fullName || 'My Business';
    await pool.request()
        .input('seller_id', sql.UniqueIdentifier, user.id)
        .input('business_name', sql.NVarChar, businessName)
        .input('email', sql.NVarChar, user.email)
        .query(`
            INSERT INTO sellers (seller_id, business_name, email, verification_status, can_sell, can_make_offers, can_edit_products)
            VALUES (@seller_id, @business_name, @email, 'pending', 1, 1, 1)
        `);

    return { verification_status: 'pending', can_sell: true, can_make_offers: true, can_edit_products: true };
}

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
