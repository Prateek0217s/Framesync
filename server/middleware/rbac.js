const Project = require('../models/Project');

// Role-based access control (PDD §5.1.4).

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const requireRole = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Insufficient permissions' });
};

// Load the referenced project and authorize access. Admins may touch any
// project; a client reviewer may only touch the single project their magic
// link is scoped to, and only if it belongs to their client entity.
// Resolves the project onto req.project for the controller to reuse.
const authorizeProjectAccess = (paramKey = 'projectId') => async (req, res, next) => {
  try {
    const projectId = req.params[paramKey] || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }

    // Client reviewer: enforce project scope + client ownership.
    const sameClient = String(project.clientId) === String(req.user.clientId);
    const sameProject = String(project._id) === String(req.auth.projectId);
    if (sameClient && sameProject) {
      req.project = project;
      return next();
    }

    return res.status(403).json({ message: 'Access denied for this project' });
  } catch (error) {
    // A malformed ObjectId in the route param is a client error, not a 500.
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    return res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = { requireAdmin, requireRole, authorizeProjectAccess };
