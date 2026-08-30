const express = require('express');
const router = express.Router();
const {
  getPortal,
  getPortalProject,
  submitComment,
  approveProject
} = require('../controllers/portalController');

// All portal routes are public — authenticated by token in the URL path
router.get('/:token', getPortal);
router.get('/:token/project/:id', getPortalProject);
router.post('/:token/project/:id/comment', submitComment);
router.post('/:token/project/:id/approve', approveProject);

module.exports = router;
