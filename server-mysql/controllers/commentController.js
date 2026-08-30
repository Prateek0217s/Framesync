const { Comment } = require('../models');

// @desc    Get all comments for a project
// @route   GET /api/comments/project/:projectId
// @access  Private/Admin
const getCommentsByProject = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { projectId: req.params.projectId },
      order: [['timestamp', 'ASC']]
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private/Admin (portal uses its own route)
const createComment = async (req, res) => {
  try {
    const { text, timestamp, projectId, authorId } = req.body;
    const comment = await Comment.create({ text, timestamp, projectId, authorId });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getCommentsByProject, createComment };
