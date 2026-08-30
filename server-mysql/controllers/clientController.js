const { Client } = require('../models');
const generateToken = require('../utils/tokenGenerator');

//  Get all clients
//   GET /api/clients
// Private/Admin
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

//  Create a client
//   POST /api/clients
// Private/Admin
const createClient = async (req, res) => {
  try {
    const { clientName, industryType, contactEmail } = req.body;

    const client = await Client.create({
      clientName,
      industryType,
      contactEmail,
      accessToken: generateToken()
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Get client by ID
//   GET /api/clients/:id
// Private/Admin
const getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
const deleteClient = async (req, res) => {
  try {
    const deletedCount = await Client.destroy({ where: { id: req.params.id } });
    if (deletedCount > 0) {
      res.json({ message: 'Client removed' });
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAllClients,
  createClient,
  getClientById,
  deleteClient
};
