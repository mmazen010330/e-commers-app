const { sql, poolPromise } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const getProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, brand, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const pool = await poolPromise;
        let query = `
            SELECT p.*, c.category_name, 
            (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1) as primary_image
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_active = 1
        `;

        if (category) query += ` AND c.slug = @category`;
        if (minPrice) query += ` AND p.base_price >= @minPrice`;
        if (maxPrice) query += ` AND p.base_price <= @maxPrice`;
        if (brand) query += ` AND p.brand = @brand`;

        query += ` ORDER BY p.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const request = pool.request();
        if (category) request.input('category', sql.NVarChar, category);
        if (minPrice) request.input('minPrice', sql.Decimal, minPrice);
        if (maxPrice) request.input('maxPrice', sql.Decimal, maxPrice);
        if (brand) request.input('brand', sql.NVarChar, brand);
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('slug', sql.NVarChar, slug)
            .query(`
                SELECT p.*, c.category_name 
                FROM products p
                JOIN categories c ON p.category_id = c.category_id
                WHERE p.slug = @slug AND p.is_active = 1
            `);

        const product = result.recordset[0];

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Get images
        const images = await pool.request()
            .input('product_id', sql.UniqueIdentifier, product.product_id)
            .query('SELECT image_url, alt_text, is_primary FROM product_images WHERE product_id = @product_id ORDER BY sort_order');

        // Get variants
        const variants = await pool.request()
            .input('product_id', sql.UniqueIdentifier, product.product_id)
            .query('SELECT * FROM product_variants WHERE product_id = @product_id');

        product.images = images.recordset;
        product.variants = variants.recordset;

        res.status(200).json({ success: true, data: product });

    } catch (error) {
        console.error('Get Product By Slug Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getRelatedProducts = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const getCategories = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order');
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getProductsByCategory = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query('SELECT * FROM products WHERE name LIKE @q AND is_active = 1');
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getSearchSuggestions = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};

const createProduct = async (req, res) => {
    try {
        const { name, sku, slug, description, base_price, stock_quantity, brand, weight_kg, category_id, image_url } = req.body;
        
        if (!name || !base_price || !category_id) {
            return res.status(400).json({ success: false, message: 'Name, Base Price and Category ID are required.' });
        }

        const pool = await poolPromise;
        const productId = uuidv4();
        
        // Auto-resolve seller_id: use first seller if user is admin or seller
        let sellerId = req.user ? req.user.userId : null;
        if (req.user && (req.user.role === 'admin' || req.user.role === 'customer')) {
            const sellerRes = await pool.request().query('SELECT TOP 1 seller_id FROM sellers');
            if (sellerRes.recordset.length > 0) {
                sellerId = sellerRes.recordset[0].seller_id;
            }
        }
        
        if (!sellerId) {
            const sellerRes = await pool.request().query('SELECT TOP 1 seller_id FROM sellers');
            if (sellerRes.recordset.length > 0) {
                sellerId = sellerRes.recordset[0].seller_id;
            }
        }

        if (!sellerId) {
            return res.status(400).json({ success: false, message: 'No valid seller account associated to create product.' });
        }

        const resolvedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const resolvedSku = sku || 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase();

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
            .query(`
                INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg)
                VALUES (@product_id, @seller_id, @category_id, @sku, @name, @slug, @description, @base_price, @stock_quantity, @brand, @weight_kg)
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

        res.status(201).json({ success: true, message: 'Product created successfully!', data: { product_id: productId } });
    } catch (error) {
        console.error('Create Product Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

module.exports = {
    getProducts,
    getProductBySlug,
    getRelatedProducts,
    getCategories,
    getProductsByCategory,
    searchProducts,
    getSearchSuggestions,
    createProduct
};
