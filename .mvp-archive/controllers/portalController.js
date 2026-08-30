const Client = require('../models/Client');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

// Helper: find and validate client by token
const findClientByToken = async (token) => {
  const client = await Client.findOne({ accessToken: token });
  return client;
};

//     Get portal data (client info + their projects)
//   GET /api/portal/:token
//  Public (token-based)
const getPortal = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    const projects = await Project.find({ clientId: client._id })
      .select('_id title status proxyMediaAsset createdAt')
      .sort({ createdAt: -1 });

    res.json({
      client: {
        _id: client._id,
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

//  Get a specific project with comments (via portal)
//    GET /api/portal/:token/project/:id
//  Public (token-based)
const getPortalProject = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      clientId: client._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied.' });
    }

    const comments = await Comment.find({ projectId: project._id })
      .sort({ timestamp: 1 });

    // Only expose masterMediaAsset if project is Approved
    const projectData = {
      _id: project._id,
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

//    Submit a time-stamped comment (via portal)
//   POST /api/portal/:token/project/:id/comment
// Public (token-based)
const submitComment = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

 
    const project = await Project.findOne({
      _id: req.params.id,
      clientId: client._id
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
      projectId: project._id,
      authorId
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//    Client approves a project (digital sign-off)
//  POST /api/portal/:token/project/:id/approve
//  Public (token-based)
const approveProject = async (req, res) => {
  try {
    const client = await findClientByToken(req.params.token);
    if (!client) {
      return res.status(404).json({ message: 'Portal not found. Invalid or expired link.' });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, clientId: client._id },
      { status: 'Approved' },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getPortal, getPortalProject, submitComment, approveProject };
