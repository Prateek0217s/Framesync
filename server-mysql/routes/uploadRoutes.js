const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadProxy, uploadMaster } = require('../controllers/uploadController');

router.post('/proxy/:projectId', authMiddleware, upload.single('video'), uploadProxy);
router.post('/master/:projectId', authMiddleware, upload.single('video'), uploadMaster);

module.exports = router;
