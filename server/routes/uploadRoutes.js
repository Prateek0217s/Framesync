const express = require('express');
const router = express.Router();

const {
  presignProxyUpload,
  presignMasterUpload,
  confirmMasterKey,
  presignProxyDownload,
  presignMasterDownload,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin, authorizeProjectAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { presignUploadSchema, masterConfirmSchema } = require('../validators');

// ---- Uploads (admin) ----
router.post(
  '/presigned-upload',
  protect,
  requireAdmin,
  validate(presignUploadSchema),
  authorizeProjectAccess('projectId'),
  asyncHandler(presignProxyUpload)
);
router.post(
  '/presigned-upload/master',
  protect,
  requireAdmin,
  validate(presignUploadSchema),
  authorizeProjectAccess('projectId'),
  asyncHandler(presignMasterUpload)
);
router.post(
  '/master/confirm',
  protect,
  requireAdmin,
  validate(masterConfirmSchema),
  authorizeProjectAccess('projectId'),
  asyncHandler(confirmMasterKey)
);

// ---- Downloads (admin or scoped client) ----
router.get(
  '/presigned-download/proxy/:projectId',
  protect,
  authorizeProjectAccess('projectId'),
  asyncHandler(presignProxyDownload)
);
router.get(
  '/presigned-download/master/:projectId',
  protect,
  authorizeProjectAccess('projectId'),
  asyncHandler(presignMasterDownload)
);

module.exports = router;
