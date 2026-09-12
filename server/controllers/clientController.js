const Client = require('../models/Client');
const Project = require('../models/Project');

// GET /api/clients  (admin)
const getAllClients = async (req, res) => {
  const clients = await Client.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  res.json(clients);
};

// POST /api/clients  (admin)
const createClient = async (req, res) => {
  const { clientName, industryType, contactEmail, logoUrl } = req.body;
  const client = await Client.create({
    clientName,
    industryType,
    contactEmail,
    logoUrl,
    ownerId: req.user._id,
  });
  res.status(201).json(client);
};

// GET /api/clients/:id  (admin)
const getClientById = async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
};

// DELETE /api/clients/:id  (admin) — blocked while projects still reference it.
const deleteClient = async (req, res) => {
  const projectCount = await Project.countDocuments({
    clientId: req.params.id,
    ownerId: req.user._id,
  });
  if (projectCount > 0) {
    return res.status(409).json({
      message: `Cannot delete: ${projectCount} project(s) still belong to this client.`,
    });
  }
  const client = await Client.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user._id,
  });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json({ message: 'Client removed' });
};

module.exports = { getAllClients, createClient, getClientById, deleteClient };
