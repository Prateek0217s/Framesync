const { Project, Client } = require('../models');

// @desc    Upload proxy video for a project
// @route   POST /api/upload/proxy/:projectId
// @access  Private/Admin
const uploadProxy = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { projectId } = req.params;
    
    // Construct local URL
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const project = await Project.findByPk(projectId, {
      include: [{ model: Client, attributes: ['id', 'clientName'] }]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.proxyMediaAsset = url;
    await project.save();

    res.json({ url, project });
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
};

// @desc    Upload master video for a project
// @route   POST /api/upload/master/:projectId
// @access  Private/Admin
const uploadMaster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { projectId } = req.params;
    
    // Construct local URL
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const project = await Project.findByPk(projectId, {
      include: [{ model: Client, attributes: ['id', 'clientName'] }]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.masterMediaAsset = url;
    await project.save();

    res.json({ url, project });
  } catch (error) {
    console.error('Upload master error:', error);
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
};

module.exports = { uploadProxy, uploadMaster };
