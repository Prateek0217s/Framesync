const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllClients,
  createClient,
  getClientById,
  deleteClient
} = require('../controllers/clientController');

router.use(authMiddleware);

router.get('/', getAllClients);
router.post('/', createClient);
router.get('/:id', getClientById);
router.delete('/:id', deleteClient);

module.exports = router;
