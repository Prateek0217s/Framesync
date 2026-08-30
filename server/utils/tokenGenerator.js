const crypto = require('crypto');

// Cryptographically secure, URL-safe magic-link token (PDD §5.1.2):
// crypto.randomBytes(32).toString('hex') → 64 hex chars.
const generateToken = () => crypto.randomBytes(32).toString('hex');

module.exports = generateToken;
