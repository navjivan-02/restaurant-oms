const prisma = require('../config/db');

// POST /api/orders — place new order (waiter)
const createOrder = async (req, res) => {
  try {
    const { restaurantId, userId } = req.user;
    const { tableId, items, notes } = req.body;

    // Validate input
    if (!tableId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Table and items are required' });
    }

    console.log('req.user:', req.user);
    console.log('menuItemIds:', items.map(item => item.menuItemId));
    console.log('restaurantId:', restaurantId);

    // Fetch menu items to get current prices
    const menuItemIds = items.map(item => item.menuItemId);
    const uniqueMenuItemIds = [...new Set(menuItemIds)];
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: uniqueMenuItemIds },
        restaurantId,
        isAvailable: true
      }
    });

    if (menuItems.length !== uniqueMenuItemIds.length) {
      return res.status(400).json({ message: 'One or more items are unavailable' });
    }

    // Create order with items in one transaction
    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId,
        waiterId: userId,
        notes,
        status: 'pending',
        orderItems: {
          create: items.map(item => {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity || 1,
              unitPrice: menuItem.price,
              notes: item.notes || '',
              status: 'pending'
            };
          })
        }
      },
      include: {
        orderItems: {
          include: { menuItem: true }
        },
        table: true
      }
    });

    // Update table status to occupied
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'occupied' }
    });

    res.status(201).json({ order, message: 'Order placed successfully' });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/orders — get all active orders
const getOrders = async (req, res) => {
  try {
    const { restaurantId } = req.user;

    const orders = await prisma.order.findMany({
      where: { 
        restaurantId,
        status: { notIn: ['billed'] }
      },
      include: {
        orderItems: {
          include: { menuItem: true }
        },
        table: true,
        waiter: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ orders });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/orders/:id — get single order
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), restaurantId },
      include: {
        orderItems: {
          include: { menuItem: true }
        },
        table: true,
        waiter: {
          select: { name: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/orders/:id/status — update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'billed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const existing = await prisma.order.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        orderItems: { include: { menuItem: true } },
        table: true
      }
    });

    // If order is billed → free up the table
    if (status === 'billed') {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'free' }
      });
    }

    res.json({ order, message: `Order status updated to ${status}` });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/orders/:id/items — add more items to existing order
const addItemsToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    const existing = await prisma.order.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (existing.status === 'billed') {
      return res.status(400).json({ message: 'Cannot add items to a billed order' });
    }

    // Fetch menu items for prices
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId }
    });

    // Add new items to order
    const newItems = await prisma.orderItem.createMany({
      data: items.map(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        return {
          orderId: parseInt(id),
          menuItemId: item.menuItemId,
          quantity: item.quantity || 1,
          unitPrice: menuItem.price,
          notes: item.notes || '',
          status: 'pending'
        };
      })
    });

    // Fetch updated order
    const order = await prisma.order.findFirst({
      where: { id: parseInt(id) },
      include: {
        orderItems: { include: { menuItem: true } },
        table: true
      }
    });

    res.json({ order, message: 'Items added to order successfully' });

  } catch (error) {
    console.error('Add items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  addItemsToOrder 
};