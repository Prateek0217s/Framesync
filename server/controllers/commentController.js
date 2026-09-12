const Comment = require('../models/Comment');
const Project = require('../models/Project');
const { emitToProject } = require('../socket');
const { sendClientCommentEmail } = require('../utils/emailTemplates');
const { getOwnerEmail } = require('../utils/notifyOwner');

// GET /api/comments/project/:projectId — timestamped comments + vector data.
// Access is authorized by middleware (admin or scoped client).
const getCommentsByProject = async (req, res) => {
  const comments = await Comment.find({ projectId: req.params.projectId }).sort({
    timestamp: 1,
    createdAt: 1,
  });
  res.json(comments);
};

// POST /api/comments — create a comment with an optional scribble stroke array.
// Author is derived from the authenticated user (never trusted from the body).
const createComment = async (req, res) => {
  const { projectId, text, timestamp, scribbleData } = req.body;
  const comment = await Comment.create({
    projectId,
    text,
    timestamp: timestamp !== undefined ? timestamp : 0,
    scribbleData: scribbleData || { strokes: [] },
    authorId: req.user._id,
    authorName: req.user.name,
    resolved: false,
  });

  emitToProject(projectId, 'comment:new', comment);

  // Client feedback → email the agency that owns the project (fire-and-forget,
  // never blocks).
  if (req.user.role === 'client') {
    (async () => {
      try {
        const project = await Project.findById(projectId)
          .select('title ownerId')
          .lean();
        const to = await getOwnerEmail(project?.ownerId);
        if (project && to) {
          await sendClientCommentEmail({
            to,
            authorName: req.user.name,
            projectTitle: project.title,
            text,
            timestamp,
          });
        }
      } catch (err) {
        console.error(`[mailer] comment notification failed: ${err.message}`);
      }
    })();
  }

  res.status(201).json(comment);
};

// PATCH /api/comments/:id/resolve  (admin) — toggle + broadcast checkbox state.
// req.comment is resolved and ownership-checked by authorizeCommentAccess.
const resolveComment = async (req, res) => {
  const { resolved } = req.body;
  const comment = await Comment.findByIdAndUpdate(
    req.comment._id,
    { resolved },
    { new: true }
  );
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  emitToProject(comment.projectId, 'comment:resolved', {
    commentId: String(comment._id),
    resolved: comment.resolved,
  });
  res.json(comment);
};

// DELETE /api/comments/:id  (admin)
const deleteComment = async (req, res) => {
  const comment = await Comment.findByIdAndDelete(req.comment._id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  res.json({ message: 'Comment removed' });
};

module.exports = {
  getCommentsByProject,
  createComment,
  resolveComment,
  deleteComment,
};
