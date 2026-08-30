const { Client, Project, Comment } = require('../models');

// Helper: find and validate client by token
const findClientByToken = async (token) => {
  const client = await Client.findOne({ where: { accessToken: token } });
  return client;
};

// @desc    Get portal data (client info + their projects)
// @route   GET /api/portal/:token
// @access  Public (token-based)
const getPortal = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    const projects = await Project.findAll({
      where: { clientId: client.id },
      attributes: ['id', 'title', 'status', 'proxyMediaAsset', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      client: {
        id: client.id,
        clientName: client.clientName,
        industryType: client.industryType,
        contactEmail: client.contactEmail
      },
      projects
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a specific project with comments (via portal)
// @route   GET /api/portal/:token/project/:id
// @access  Public (token-based)
const getPortalProject = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    const project = await Project.findOne({
      where: {
        id: req.params.id,
        clientId: client.id
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied.' });
    }

    const comments = await Comment.findAll({
      where: { projectId: project.id },
      order: [['timestamp', 'ASC']]
    });

    // Only expose masterMediaAsset if project is Approved
    const projectData = {
      id: project.id,
      title: project.title,
      status: project.status,
      proxyMediaAsset: project.proxyMediaAsset,
      createdAt: project.createdAt,
      ...(project.status === 'Approved' && { masterMediaAsset: project.masterMediaAsset })
    };

    res.json({ project: projectData, comments });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Submit a time-stamped comment (via portal)
// @route   POST /api/portal/:token/project/:id/comment
// @access  Public (token-based)
const submitComment = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    // Verify the project belongs to this client
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        clientId: client.id
      }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied.' });
    }

    const { text, timestamp, authorId } = req.body;

    if (!text || !authorId) {
      return res.status(400).json({ message: 'Text and author name are required.' });
    }

    const comment = await Comment.create({
      text,
      timestamp: timestamp !== undefined ? Math.floor(timestamp) : 0,
      projectId: project.id,
      authorId
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Client approves a project (digital sign-off)
// @route   POST /api/portal/:token/project/:id/approve
// @access  Public (token-based)
const approveProject = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    const project = await Project.findOne({
      where: { id: req.params.id, clientId: client.id }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied.' });
    }

    project.status = 'Approved';
    await project.save();

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getPortal, getPortalProject, submitComment, approveProject };
