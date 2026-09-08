const User = require('../models/User');

// Agency admin recipients for event notifications (PDD §5.6.4). Returns a
// single comma-separated address list (nodemailer accepts multi-recipient
// strings) so each event is one outbound email, or null when no admins exist.
const getAdminEmailList = async () => {
  const admins = await User.find({ role: 'admin' }).select('email').lean();
  const emails = admins.map((a) => a.email).filter(Boolean);
  return emails.length ? emails.join(', ') : null;
};

module.exports = { getAdminEmailList };
