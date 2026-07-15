const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

exports.verify = (token) => jwt.verify(token, jwtSecret);
exports.decode = (token) => jwt.decode(token);
