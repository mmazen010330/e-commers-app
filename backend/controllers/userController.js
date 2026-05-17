const { sql, poolPromise } = require('../database/db');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .query('SELECT user_id, email, full_name, phone, role, created_at FROM users WHERE user_id = @user_id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .input('full_name', sql.NVarChar, full_name)
            .input('phone', sql.NVarChar, phone || null)
            .query('UPDATE users SET full_name = @full_name, phone = @phone WHERE user_id = @user_id');

        res.status(200).json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .query('SELECT * FROM addresses WHERE customer_id = @customer_id ORDER BY is_default DESC');

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address_type, recipient_name, street, city, state, country, postal_code, is_default } = req.body;
        const pool = await poolPromise;

        if (is_default) {
            await pool.request()
                .input('customer_id', sql.UniqueIdentifier, userId)
                .query('UPDATE addresses SET is_default = 0 WHERE customer_id = @customer_id');
        }

        await pool.request()
            .input('customer_id', sql.UniqueIdentifier, userId)
            .input('address_type', sql.NVarChar, address_type)
            .input('recipient_name', sql.NVarChar, recipient_name)
            .input('street', sql.NVarChar, street)
            .input('city', sql.NVarChar, city)
            .input('state', sql.NVarChar, state)
            .input('country', sql.NVarChar, country)
            .input('postal_code', sql.NVarChar, postal_code)
            .input('is_default', sql.Bit, is_default ? 1 : 0)
            .query('INSERT INTO addresses (customer_id, address_type, recipient_name, street, city, state, country, postal_code, is_default) VALUES (@customer_id, @address_type, @recipient_name, @street, @city, @state, @country, @postal_code, @is_default)');

        res.status(201).json({ success: true, message: 'Address added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateAddress = async (req, res) => {
    res.status(200).json({ success: true, message: 'Address updated' });
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM addresses WHERE address_id = @id');
        res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const pool = await poolPromise;

        await pool.request().input('customer_id', sql.UniqueIdentifier, userId).query('UPDATE addresses SET is_default = 0 WHERE customer_id = @customer_id');
        await pool.request().input('id', sql.UniqueIdentifier, id).query('UPDATE addresses SET is_default = 1 WHERE address_id = @id');

        res.status(200).json({ success: true, message: 'Default address set' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
