const express = require('express');
const router = express.Router();
const { 
  getMenu, 
  createCategory, 
  createItem, 
  updateItem, 
  deleteItem, 
  toggleAvailability 
} = require('../controllers/menu.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticate);

// Waiter + billing + admin can view menu
router.get('/', getMenu);

// Admin only routes
router.post('/categories', roleCheck('admin'), createCategory);
router.post('/items', roleCheck('admin'), createItem);
router.put('/items/:id', roleCheck('admin'), updateItem);
router.delete('/items/:id', roleCheck('admin'), deleteItem);
router.patch('/items/:id/availability', roleCheck('admin'), toggleAvailability);

module.exports = router;