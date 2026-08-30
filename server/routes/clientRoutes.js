const express = require('express');
const router = express.Router();

const {
  getAllClients,
  createClient,
  getClientById,
  deleteClient,
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { createClientSchema } = require('../validators');

// All client management is admin-only.
router.use(protect, requireAdmin);

router.get('/', asyncHandler(getAllClients));
router.post('/', validate(createClientSchema), asyncHandler(createClient));
router.get('/:id', asyncHandler(getClientById));
router.delete('/:id', asyncHandler(deleteClient));

module.exports = router;
