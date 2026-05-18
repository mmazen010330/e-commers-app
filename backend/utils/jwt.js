const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_ACCESS_SECRET || 'access_secret',
        { expiresIn: '7d' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.user_id },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: '7d' }
    );
};

module.exports = {
    generateAccessToken,
    generateRefreshToken
};
