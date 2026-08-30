const express = require('express');
const router = express.Router();

const {
  getAllProjects,
  createProject,
  getProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin, authorizeProjectAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  createProjectSchema,
  updateProjectSchema,
  updateStatusSchema,
} = require('../validators');

router.get('/', protect, requireAdmin, asyncHandler(getAllProjects));
router.post('/', protect, requireAdmin, validate(createProjectSchema), asyncHandler(createProject));

// Readable by an admin or the scoped client reviewer.
router.get('/:id', protect, authorizeProjectAccess('id'), asyncHandler(getProjectById));

router.put('/:id', protect, requireAdmin, validate(updateProjectSchema), asyncHandler(updateProject));
router.patch(
  '/:id/status',
  protect,
  requireAdmin,
  validate(updateStatusSchema),
  asyncHandler(updateProjectStatus)
);
router.delete('/:id', protect, requireAdmin, asyncHandler(deleteProject));

module.exports = router;
