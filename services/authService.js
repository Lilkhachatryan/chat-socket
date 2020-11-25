const jwt = require('jsonwebtoken');
const JWT_KEY = process.env.JWT_KEY || 'dev-jwt';

const authenticateJWT = (header) => {
    const token = header.split(' ')[1];
    return jwt.verify(token, JWT_KEY, (err, user) => {
        if (err) {
            return false
        }
        return user
    });
};

module.exports = {
    authenticateJWT
};
