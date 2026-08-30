const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Verify the JWT and attach the live user. Works for both admins and
// magic-link reviewers (both are backed by a User doc). The decoded token is
// kept on req.auth so RBAC can read a client's project scope.
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user;
    req.auth = decoded; // { id, role, clientId?, projectId? }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
