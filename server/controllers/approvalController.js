const Approval = require('../models/Approval');
const { emitToProject, emitToDashboard } = require('../socket');

// POST /api/approvals/:projectId/approve — immutable legal sign-off (PDD §5.5.2).
// Transitions the project to 'Approved' and unlocks the master asset slot.
const approveProject = async (req, res) => {
  const project = req.project; // resolved + authorized by middleware
  const { digitalSig } = req.body;

  if (project.status === 'Approved') {
    return res.status(409).json({ message: 'Project is already approved.' });
  }
  const existing = await Approval.findOne({ projectId: project._id });
  if (existing) {
    return res.status(409).json({ message: 'An approval record already exists.' });
  }

  const approval = await Approval.create({
    projectId: project._id,
    approvedBy: req.user._id,
    approvedAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    digitalSig,
  });

  project.status = 'Approved';
  await project.save();

  // Broadcast unlock + Kanban stage change to every connected viewer.
  const approvedPayload = {
    projectId: String(project._id),
    approvedBy: req.user.name,
  };
  const statusPayload = { projectId: String(project._id), newStatus: 'Approved' };
  emitToProject(project._id, 'project:approved', approvedPayload);
  emitToProject(project._id, 'project:statusChanged', statusPayload);
  emitToDashboard('project:approved', approvedPayload);
  emitToDashboard('project:statusChanged', statusPayload);

  res.status(201).json({ approval, project });
};

// GET /api/approvals/:projectId — fetch the audit record.
const getApproval = async (req, res) => {
  const approval = await Approval.findOne({ projectId: req.params.projectId }).populate(
    'approvedBy',
    'name email'
  );
  if (!approval) return res.status(404).json({ message: 'No approval record found.' });
  res.json(approval);
};

module.exports = { approveProject, getApproval };
