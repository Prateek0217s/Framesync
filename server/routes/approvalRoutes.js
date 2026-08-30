const express = require('express');
const router = express.Router();

const { approveProject, getApproval } = require('../controllers/approvalController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeProjectAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { approveSchema } = require('../validators');

router.post(
  '/:projectId/approve',
  protect,
  authorizeProjectAccess('projectId'),
  validate(approveSchema),
  asyncHandler(approveProject)
);
router.get(
  '/:projectId',
  protect,
  authorizeProjectAccess('projectId'),
  asyncHandler(getApproval)
);

module.exports = router;
