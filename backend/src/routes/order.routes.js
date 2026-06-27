const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addItemsToOrder
} = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticate);

// Waiter places order
router.post('/', roleCheck('waiter'), createOrder);

// All staff can fetch orders (waiter sees own orders client-side filtered)
router.get('/', roleCheck('waiter', 'kitchen', 'billing', 'admin'), getOrders);

// Any authenticated user can get single order
router.get('/:id', getOrderById);

// Kitchen + billing can update status
router.patch('/:id/status', roleCheck('kitchen', 'billing', 'admin'), updateOrderStatus);

// Waiter adds more items
router.post('/:id/items', roleCheck('waiter'), addItemsToOrder);

module.exports = router;