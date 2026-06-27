const prisma = require('../config/db');
const { getIo } = require('../config/socket');

// POST /api/bills/generate/:orderId
const generateBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { restaurantId } = req.user;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(orderId), restaurantId },
      include: {
        orderItems: { include: { menuItem: true } },
        table: true,
        bill: true,
      },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.bill) return res.status(400).json({ message: 'Bill already generated for this order' });

    const subtotal = order.orderItems.reduce(
      (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0
    );
    const gstPercent = 5.00;
    const gstAmount  = parseFloat((subtotal * gstPercent / 100).toFixed(2));
    const totalAmount = parseFloat((subtotal + gstAmount).toFixed(2));

    // Create bill + mark order billed + free table — all atomic
    const bill = await prisma.$transaction(async (tx) => {
      const newBill = await tx.bill.create({
        data: { orderId: order.id, restaurantId, subtotal, gstPercent, gstAmount, totalAmount },
        include: {
          order: {
            include: {
              orderItems: { include: { menuItem: true } },
              table: true,
            },
          },
          restaurant: true,
        },
      });

      await tx.order.update({ where: { id: order.id }, data: { status: 'billed' } });
      await tx.table.update({ where: { id: order.tableId }, data: { status: 'free' } });

      return newBill;
    });

    // Emit real-time events
    const io  = getIo();
    const room = `restaurant_${restaurantId}`;
    io.to(room).emit('bill:generated',       bill);
    io.to(room).emit('order:status_updated', { ...order, status: 'billed' });
    io.to(room).emit('table:status_updated', { ...order.table, status: 'free' });

    res.status(201).json({ bill, message: 'Bill generated successfully' });
  } catch (error) {
    console.error('Generate bill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/bills/:id/payment
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;
    const { paymentMethod, customerPhone } = req.body;

    const existing = await prisma.bill.findFirst({ where: { id: parseInt(id), restaurantId } });
    if (!existing) return res.status(404).json({ message: 'Bill not found' });
    if (existing.paymentStatus === 'paid') return res.status(400).json({ message: 'Bill already paid' });

    if (!['cash', 'upi', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Payment method must be cash, upi, or card' });
    }

    const bill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: { paymentStatus: 'paid', paymentMethod, customerPhone },
      include: { order: { include: { table: true } }, restaurant: true },
    });

    res.json({ bill, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { generateBill, markAsPaid };
