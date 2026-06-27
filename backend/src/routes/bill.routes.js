const express = require('express');
const router = express.Router();
const { generateBill, markAsPaid } = require('../controllers/bill.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.use(authenticate);

router.post('/generate/:orderId', roleCheck('billing', 'admin'), generateBill);
router.patch('/:id/payment',     roleCheck('billing', 'admin'), markAsPaid);

module.exports = router;
