const User = require('../models/User');

// Notification recipient for a domain event (PDD §5.6.4). Events belong to the
// agency account that owns the project, so we resolve that one owner's address
// rather than mailing every admin in the database — which would leak each
// agency's activity to all the others. Returns a single address, or null when
// the owner or their email can't be resolved (callers skip the send).
const getOwnerEmail = async (ownerId) => {
  if (!ownerId) return null;
  const owner = await User.findById(ownerId).select('email').lean();
  return owner?.email || null;
};

module.exports = { getOwnerEmail };
