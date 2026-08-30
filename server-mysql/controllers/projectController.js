const { Project, Client } = require('../models');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private/Admin
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{
        model: Client,
        attributes: ['id', 'clientName']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const { title, clientId } = req.body;
    const project = await Project.create({
      title,
      clientId
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private/Admin
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [Client]
    });
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Private/Admin
const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Pre-Production', 'Rough Cut', 'Client Review', 'Approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const project = await Project.findByPk(req.params.id);

    if (project) {
      project.status = status;
      await project.save();
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const deletedCount = await Project.destroy({ where: { id: req.params.id } });
    if (deletedCount > 0) {
      res.json({ message: 'Project removed' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAllProjects,
  createProject,
  getProjectById,
  updateProjectStatus,
  deleteProject
};
