const Comment = require('../models/Comment');
const { emitToProject } = require('../socket');

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
  res.status(201).json(comment);
};

// PATCH /api/comments/:id/resolve  (admin) — toggle + broadcast checkbox state.
const resolveComment = async (req, res) => {
  const { resolved } = req.body;
  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
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
  const comment = await Comment.findByIdAndDelete(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  res.json({ message: 'Comment removed' });
};

module.exports = {
  getCommentsByProject,
  createComment,
  resolveComment,
  deleteComment,
};
