const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const ReviewLink = require('../models/ReviewLink');
const generateToken = require('../utils/tokenGenerator');
const { signToken } = require('../utils/jwt');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Reviewers are keyed by their client entity — one reviewer identity per client,
// reused across that client's projects (PDD §5.1.2). The email is informational
// (lookups are by clientId), so if a client's contactEmail collides with an
// existing account we fall back to a per-client address rather than 500-ing on
// the unique email index.
const findOrCreateReviewer = async (client) => {
  const existing = await User.findOne({ clientId: client._id, role: 'client' });
  if (existing) return existing;
  try {
    return await User.create({
      email: client.contactEmail,
      name: client.clientName,
      role: 'client',
      clientId: client._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return User.create({
        email: `client+${client._id}@framesync.local`,
        name: client.clientName,
        role: 'client',
        clientId: client._id,
      });
    }
    throw err;
  }
};

// POST /api/auth/register — create an agency admin (PDD FR-5.1.1).
const register = async (req, res) => {
  const { email, name, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const user = await User.create({
    email,
    name,
    passwordHash: password, // hashed by the pre-save hook (12 rounds)
    role: 'admin',
  });
  const token = signToken({ id: user._id, role: user.role });
  res.status(201).json({ token, user });
};

// POST /api/auth/login — authenticate an admin, return a 7-day JWT.
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin' }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken({ id: user._id, role: user.role });
  res.json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } });
};

// GET /api/auth/me — return the authenticated profile.
const getMe = async (req, res) => {
  res.json(req.user);
};

// POST /api/auth/magic-link/generate — mint a project-scoped review link.
// (PDD FR-5.1.2/5.1.3). Admin only.
const generateMagicLink = async (req, res) => {
  const { projectId } = req.body;
  const project = await Project.findById(projectId).populate('clientId');
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  if (!project.clientId) {
    return res.status(409).json({ message: 'Project has no associated client.' });
  }

  // Ensure the client's reviewer identity exists (reused across their projects).
  await findOrCreateReviewer(project.clientId);

  const link = await ReviewLink.create({
    projectId: project._id,
    token: generateToken(),
    expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    active: true,
    createdBy: req.user._id,
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.status(201).json({
    token: link.token,
    url: `${clientUrl}/portal/${link.token}`,
    expiresAt: link.expiresAt,
    project: { _id: project._id, title: project.title },
  });
};

// POST /api/auth/magic-link/verify/:token — exchange a magic token for a
// client session JWT scoped to that one project.
const verifyMagicLink = async (req, res) => {
  const link = await ReviewLink.findOne({ token: req.params.token });
  if (!link || !link.isValid()) {
    return res.status(401).json({ message: 'This review link is invalid or has expired.' });
  }

  const project = await Project.findById(link.projectId).populate('clientId');
  if (!project) {
    return res.status(404).json({ message: 'The project for this link no longer exists.' });
  }
  if (!project.clientId) {
    return res
      .status(409)
      .json({ message: 'The project for this link has no associated client.' });
  }

  const reviewer = await findOrCreateReviewer(project.clientId);

  // Record first use (link remains reusable until expiry).
  if (!link.usedAt) {
    link.usedAt = new Date();
    await link.save();
  }

  const token = signToken({
    id: reviewer._id,
    role: 'client',
    clientId: project.clientId._id,
    projectId: project._id,
  });

  res.json({
    token,
    user: { _id: reviewer._id, name: reviewer.name, role: 'client', clientId: project.clientId._id },
    project: {
      _id: project._id,
      title: project.title,
      status: project.status,
      client: { _id: project.clientId._id, clientName: project.clientId.clientName },
    },
  });
};

module.exports = { register, login, getMe, generateMagicLink, verifyMagicLink };
