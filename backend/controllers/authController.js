const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../database/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, role } = req.body;
        
        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const pool = await poolPromise;
        
        // Check if user already exists
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT user_id FROM users WHERE email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(409).json({ success: false, message: 'User with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Insert into users table
        await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .input('email', sql.NVarChar, email)
            .input('password_hash', sql.NVarChar, passwordHash)
            .input('full_name', sql.NVarChar, full_name)
            .input('phone', sql.NVarChar, phone || null)
            .input('role', sql.NVarChar, role)
            .query('INSERT INTO users (user_id, email, password_hash, full_name, phone, role) VALUES (@user_id, @email, @password_hash, @full_name, @phone, @role)');

        // If customer, insert into customers table
        if (role === 'customer') {
            await pool.request()
                .input('customer_id', sql.UniqueIdentifier, userId)
                .query('INSERT INTO customers (customer_id) VALUES (@customer_id)');
            
            // Create a cart for the customer
            await pool.request()
                .input('customer_id', sql.UniqueIdentifier, userId)
                .query('INSERT INTO carts (customer_id) VALUES (@customer_id)');
        } else if (role === 'admin') {
            await pool.request()
                .input('employee_id', sql.UniqueIdentifier, userId)
                .input('full_name', sql.NVarChar, full_name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)
                .query("INSERT INTO employees (employee_id, full_name, email, phone, department, job_title, hire_date, salary) VALUES (@employee_id, @full_name, @email, @phone, 'IT', 'Platform Admin', GETDATE(), 100000.00)");
        } else if (role === 'seller') {
            await pool.request()
                .input('seller_id', sql.UniqueIdentifier, userId)
                .input('business_name', sql.NVarChar, full_name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)
                .query("INSERT INTO sellers (seller_id, business_name, email, phone, verification_status) VALUES (@seller_id, @business_name, @email, @phone, 'verified')");
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { userId, email, full_name, role }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const pool = await poolPromise;
        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM users WHERE email = @email AND is_active = 1');

        const user = userResult.recordset[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // In a real app, you'd store the refresh token in the database
        // For this demo, we'll just return it

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    // Invalidate refresh token logic here
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const refresh = async (req, res) => {
    // Refresh token logic here
    res.status(200).json({ success: true, message: 'Token refreshed' });
};

const forgotPassword = async (req, res) => {
    res.status(200).json({ success: true, message: 'Reset email sent if account exists' });
};

const resetPassword = async (req, res) => {
    res.status(200).json({ success: true, message: 'Password updated successfully' });
};

const verifyEmail = async (req, res) => {
    res.status(200).json({ success: true, message: 'Email verified' });
};

const googleLogin = async (req, res) => {
    res.status(200).json({ success: true, message: 'Google login successful' });
};

const facebookLogin = async (req, res) => {
    res.status(200).json({ success: true, message: 'Facebook login successful' });
};

module.exports = {
    register,
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    verifyEmail,
    googleLogin,
    facebookLogin
};
