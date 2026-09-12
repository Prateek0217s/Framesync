const Project = require('../models/Project');
const Client = require('../models/Client');
const Comment = require('../models/Comment');
const ReviewLink = require('../models/ReviewLink');
const Approval = require('../models/Approval');
const { emitToProject, emitToDashboard } = require('../socket');
const { deleteObject } = require('../utils/storage');

// GET /api/projects  (admin) — supports ?status= & ?clientId= (PDD §8.1).
// Always scoped to the caller's own workspace.
const getAllProjects = async (req, res) => {
  const filter = { ownerId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.clientId) filter.clientId = req.query.clientId;

  const projects = await Project.find(filter)
    .populate('clientId', 'clientName logoUrl _id')
    .sort({ createdAt: -1 });
  res.json(projects);
};

// POST /api/projects  (admin)
const createProject = async (req, res) => {
  const { title, clientId } = req.body;
  // The client must belong to the caller — otherwise an admin could attach
  // their project to another agency's brand.
  const client = await Client.findOne({ _id: clientId, ownerId: req.user._id });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const project = await Project.create({
    title,
    clientId,
    ownerId: req.user._id,
  });
  const populated = await project.populate('clientId', 'clientName logoUrl _id');
  res.status(201).json(populated);
};

// GET /api/projects/:id  (admin or scoped client) — access checked by middleware.
// Reuses the document authorizeProjectAccess already resolved rather than
// re-fetching unguarded: if that middleware is ever dropped from the route, this
// fails closed instead of leaking another agency's project.
const getProjectById = async (req, res) => {
  const project = await req.project.populate('clientId');
  res.json(project);
};

// PUT /api/projects/:id  (admin) — title/client/proxy metadata.
// masterMediaKey is intentionally NOT settable here (Level Lock, PDD §5.5).
const updateProject = async (req, res) => {
  const allowed = ['title', 'clientId', 'proxyMediaKey', 'thumbnailKey', 'version'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  // Reassigning a project to a different brand must respect the tenant
  // boundary — the new client has to be one of the caller's own.
  if (update.clientId !== undefined) {
    const client = await Client.findOne({
      _id: update.clientId,
      ownerId: req.user._id,
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    update.ownerId = client.ownerId;
  }

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user._id },
    update,
    { new: true, runValidators: true }
  ).populate('clientId', 'clientName logoUrl _id');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
};

// PATCH /api/projects/:id/status  (admin) — Kanban stage change + broadcast.
const updateProjectStatus = async (req, res) => {
  const { status } = req.body;

  // Level Lock integrity (PDD §5.5): 'Approved' is a terminal state reachable
  // ONLY through the client's immutable digital sign-off
  // (POST /approvals/:projectId/approve), never via a manual status change —
  // otherwise the master asset would unlock with no audit record.
  if (status === 'Approved') {
    return res.status(409).json({
      message:
        'Approval requires the client’s digital sign-off and cannot be set manually.',
    });
  }

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user._id },
    { status },
    { new: true }
  );
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const payload = { projectId: String(project._id), newStatus: status };
  emitToProject(project._id, 'project:statusChanged', payload);
  emitToDashboard(project.ownerId, 'project:statusChanged', payload);
  res.json(project);
};

// DELETE /api/projects/:id  (admin) — cascade remove dependents.
const deleteProject = async (req, res) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user._id,
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  // Best-effort removal of the project's private media so nothing is left
  // orphaned in the bucket. Never fail the deletion on a storage hiccup.
  const keys = [
    project.proxyMediaKey,
    project.masterMediaKey,
    project.thumbnailKey,
  ].filter(Boolean);
  await Promise.all(keys.map((k) => deleteObject(k).catch(() => {})));

  await Promise.all([
    Comment.deleteMany({ projectId: project._id }),
    ReviewLink.deleteMany({ projectId: project._id }),
    Approval.deleteOne({ projectId: project._id }),
  ]);
  res.json({ message: 'Project and associated records removed' });
};

module.exports = {
  getAllProjects,
  createProject,
  getProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
};
