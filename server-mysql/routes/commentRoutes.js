const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getCommentsByProject, createComment } = require('../controllers/commentController');

router.use(authMiddleware);

router.get('/project/:projectId', getCommentsByProject);
router.post('/', createComment);

module.exports = router;
