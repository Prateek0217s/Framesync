const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllProjects,
  createProject,
  getProjectById,
  updateProjectStatus,
  deleteProject
} = require('../controllers/projectController');

router.use(authMiddleware);

router.get('/', getAllProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.patch('/:id/status', updateProjectStatus);
router.delete('/:id', deleteProject);

module.exports = router;
