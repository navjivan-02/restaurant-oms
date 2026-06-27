const express = require('express');
const router = express.Router();
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus
} = require('../controllers/table.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticate);

// Waiter + admin + billing can view tables
router.get('/', getTables);

// Admin only
router.post('/', roleCheck('admin'), createTable);
router.put('/:id', roleCheck('admin'), updateTable);
router.delete('/:id', roleCheck('admin'), deleteTable);

// Waiter + admin can update table status
router.patch('/:id/status', roleCheck('admin', 'waiter'), updateTableStatus);

module.exports = router;