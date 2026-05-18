const { sql, poolPromise } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────
// SELLER: Create a new offer on their product
// POST /api/seller/offers
// ─────────────────────────────────────────────
const createOffer = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { product_id, offer_title, discount_type, discount_value, offer_price, start_date, end_date } = req.body;

        if (!product_id || !offer_title || !discount_type || !discount_value || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'product_id, offer_title, discount_type, discount_value, start_date and end_date are required.' });
        }

        const pool = await poolPromise;

        // Check seller permissions
        const permCheck = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('SELECT can_sell, can_make_offers, verification_status FROM sellers WHERE seller_id = @seller_id');

        if (!permCheck.recordset.length) {
            return res.status(404).json({ success: false, message: 'Seller profile not found.' });
        }
        const seller = permCheck.recordset[0];
        if (!seller.can_make_offers) {
            return res.status(403).json({ success: false, message: 'Your offer privileges have been suspended by the administrator.' });
        }

        // Verify product belongs to this seller
        const prodCheck = await pool.request()
            .input('product_id', sql.UniqueIdentifier, product_id)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query('SELECT product_id FROM products WHERE product_id = @product_id AND seller_id = @seller_id');

        if (!prodCheck.recordset.length) {
            return res.status(403).json({ success: false, message: 'Product not found or does not belong to you.' });
        }

        const offerId = uuidv4();
        await pool.request()
            .input('offer_id',      sql.UniqueIdentifier, offerId)
            .input('product_id',    sql.UniqueIdentifier, product_id)
            .input('seller_id',     sql.UniqueIdentifier, sellerId)
            .input('offer_title',   sql.NVarChar, offer_title)
            .input('discount_type', sql.NVarChar, discount_type)
            .input('discount_value',sql.Decimal,  parseFloat(discount_value))
            .input('offer_price',   sql.Decimal,  offer_price ? parseFloat(offer_price) : null)
            .input('start_date',    sql.DateTime, new Date(start_date))
            .input('end_date',      sql.DateTime, new Date(end_date))
            .query(`
                INSERT INTO offers
                    (offer_id, product_id, seller_id, offer_title, discount_type, discount_value, offer_price, start_date, end_date, status)
                VALUES
                    (@offer_id, @product_id, @seller_id, @offer_title, @discount_type, @discount_value, @offer_price, @start_date, @end_date, 'pending')
            `);

        res.status(201).json({ success: true, message: 'Offer submitted successfully and is pending admin approval.', data: { offer_id: offerId } });
    } catch (error) {
        console.error('Create Offer Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// SELLER: List their own offers
// GET /api/seller/offers
// ─────────────────────────────────────────────
const getSellerOffers = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query(`
                SELECT so.*, p.name as product_name, p.base_price
                FROM offers so
                JOIN products p ON so.product_id = p.product_id
                WHERE so.seller_id = @seller_id
                ORDER BY so.created_at DESC
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Get Seller Offers Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// SELLER: Delete a pending offer
// DELETE /api/seller/offers/:id
// ─────────────────────────────────────────────
const deleteOffer = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const offerId  = req.params.id;
        const pool     = await poolPromise;

        // Only allow deleting 'pending' offers (can't delete approved/rejected)
        const result = await pool.request()
            .input('offer_id',  sql.UniqueIdentifier, offerId)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .query(`
                DELETE FROM offers
                WHERE offer_id = @offer_id AND seller_id = @seller_id AND status = 'pending'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Offer not found, not owned by you, or already processed.' });
        }

        res.status(200).json({ success: true, message: 'Offer withdrawn successfully.' });
    } catch (error) {
        console.error('Delete Offer Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Get all pending offers
// GET /api/admin/offers/pending
// ─────────────────────────────────────────────
const getPendingOffers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT so.*, p.name as product_name, p.base_price, s.business_name,
                       u.full_name as seller_full_name
                FROM offers so
                JOIN products p ON so.product_id = p.product_id
                JOIN sellers s  ON so.seller_id  = s.seller_id
                JOIN users u    ON so.seller_id  = u.user_id
                WHERE so.status = 'pending'
                ORDER BY so.created_at ASC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Get Pending Offers Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Get all offers (any status)
// GET /api/admin/offers
// ─────────────────────────────────────────────
const getAllOffers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT so.*, p.name as product_name, p.base_price, s.business_name
                FROM offers so
                JOIN products p ON so.product_id = p.product_id
                JOIN sellers s  ON so.seller_id  = s.seller_id
                ORDER BY so.created_at DESC
            `);
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Get All Offers Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Approve an offer
// PUT /api/admin/offers/:id/approve
// ─────────────────────────────────────────────
const approveOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const pool = await poolPromise;

        // Fetch the offer to apply the discount on the product
        const offerRes = await pool.request()
            .input('offer_id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM offers WHERE offer_id = @offer_id');

        if (!offerRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Offer not found.' });
        }
        const offer = offerRes.recordset[0];

        // Mark offer as approved
        await pool.request()
            .input('offer_id', sql.UniqueIdentifier, id)
            .query("UPDATE offers SET status = 'approved' WHERE offer_id = @offer_id");

        // Also apply the offer to the product's offer_price and flag it as an offer
        await pool.request()
            .input('product_id',  sql.UniqueIdentifier, offer.product_id)
            .input('offer_price', sql.Decimal, offer.offer_price || null)
            .query("UPDATE products SET is_offer = 1, offer_price = @offer_price WHERE product_id = @product_id");

        // Audit log
        await pool.request()
            .input('action_id',     sql.UniqueIdentifier, require('uuid').v4())
            .input('admin_user_id', sql.UniqueIdentifier, adminId)
            .input('target_type',   sql.NVarChar, 'offer')
            .input('target_id',     sql.NVarChar, id)
            .input('action',        sql.NVarChar, 'approve')
            .query('INSERT INTO admin_actions (action_id,admin_user_id,target_type,target_id,action) VALUES (@action_id,@admin_user_id,@target_type,@target_id,@action)');

        res.status(200).json({ success: true, message: 'Offer approved and applied to product successfully!' });
    } catch (error) {
        console.error('Approve Offer Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Reject an offer
// PUT /api/admin/offers/:id/reject
// ─────────────────────────────────────────────
const rejectOffer = async (req, res) => {
    try {
        const { id }   = req.params;
        const adminId  = req.user.id;
        const { note } = req.body;
        const pool     = await poolPromise;

        await pool.request()
            .input('offer_id',   sql.UniqueIdentifier, id)
            .input('admin_note', sql.NVarChar, note || null)
            .query("UPDATE offers SET status = 'rejected', admin_note = @admin_note WHERE offer_id = @offer_id");

        // Audit log
        await pool.request()
            .input('action_id',     sql.UniqueIdentifier, require('uuid').v4())
            .input('admin_user_id', sql.UniqueIdentifier, adminId)
            .input('target_type',   sql.NVarChar, 'offer')
            .input('target_id',     sql.NVarChar, id)
            .input('action',        sql.NVarChar, 'reject')
            .input('note',          sql.NVarChar, note || null)
            .query('INSERT INTO admin_actions (action_id,admin_user_id,target_type,target_id,action,note) VALUES (@action_id,@admin_user_id,@target_type,@target_id,@action,@note)');

        res.status(200).json({ success: true, message: 'Offer rejected.' });
    } catch (error) {
        console.error('Reject Offer Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createOffer,
    getSellerOffers,
    deleteOffer,
    getPendingOffers,
    getAllOffers,
    approveOffer,
    rejectOffer
};
