const jwt = require('jsonwebtoken');

// Sign a 7-day session token (PDD §5.1.1). Payload carries the user id, role,
// and — for external reviewers — the clientId and the single project their
// magic link is scoped to.
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { signToken, verifyToken };
