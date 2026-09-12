const express = require('express');
const router = express.Router();

const {
  getCommentsByProject,
  createComment,
  resolveComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin, authorizeProjectAccess, authorizeCommentAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { createCommentSchema, resolveCommentSchema } = require('../validators');

// List: admin or scoped client.
router.get(
  '/project/:projectId',
  protect,
  authorizeProjectAccess('projectId'),
  asyncHandler(getCommentsByProject)
);

// Create: admin or scoped client (validate first so body.projectId is parsed
// before the access check reads it).
router.post(
  '/',
  protect,
  validate(createCommentSchema),
  authorizeProjectAccess('projectId'),
  asyncHandler(createComment)
);

// Resolve / delete: admin only, and only within the caller's own workspace
// (authorizeCommentAccess resolves the comment's project and checks ownership).
router.patch(
  '/:id/resolve',
  protect,
  requireAdmin,
  validate(resolveCommentSchema),
  authorizeCommentAccess,
  asyncHandler(resolveComment)
);
router.delete(
  '/:id',
  protect,
  requireAdmin,
  authorizeCommentAccess,
  asyncHandler(deleteComment)
);

module.exports = router;
