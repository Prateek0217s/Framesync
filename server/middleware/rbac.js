const Project = require('../models/Project');
const Comment = require('../models/Comment');

// Role-based access control (PDD §5.1.4).

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const requireRole = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Insufficient permissions' });
};

// Load the referenced project and authorize access. An admin may only touch a
// project their own account owns; a client reviewer may only touch the single
// project their magic link is scoped to, and only if it belongs to their client
// entity. Resolves the project onto req.project for the controller to reuse.
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
      // Tenant boundary: an admin reaches only projects their account owns.
      if (String(project.ownerId) === String(req.user._id)) {
        req.project = project;
        return next();
      }
      return res.status(403).json({ message: 'Access denied for this project' });
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

// Comments carry no ownerId of their own — they inherit their project's
// tenancy. Resolve the comment, then confirm its project belongs to the caller.
// Answers 404 (not 403) for a foreign comment so the response can't be used to
// confirm that another agency's comment exists.
const authorizeCommentAccess = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const project = await Project.findById(comment.projectId).select('ownerId clientId');
    if (!project) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const allowed =
      req.user.role === 'admin'
        ? String(project.ownerId) === String(req.user._id)
        : String(project.clientId) === String(req.user.clientId) &&
          String(project._id) === String(req.auth.projectId);

    if (!allowed) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    req.comment = comment;
    return next();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid comment id' });
    }
    return res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = { requireAdmin, requireRole, authorizeProjectAccess, authorizeCommentAccess };
