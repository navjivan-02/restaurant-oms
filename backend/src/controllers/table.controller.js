const prisma = require('../config/db');

// GET /api/tables — get all tables with status
const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.user;

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' }
    });

    res.json({ tables });

  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/tables — add new table (admin only)
const createTable = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { tableNumber, capacity } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number is required' });
    }

    // Check if table number already exists
    const existing = await prisma.table.findFirst({
      where: { tableNumber, restaurantId }
    });

    if (existing) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = await prisma.table.create({
      data: {
        tableNumber,
        capacity: capacity || 4,
        restaurantId
      }
    });

    res.status(201).json({ table, message: 'Table created successfully' });

  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/tables/:id — update table (admin only)
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;
    const { tableNumber, capacity } = req.body;

    const existing = await prisma.table.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const table = await prisma.table.update({
      where: { id: parseInt(id) },
      data: { tableNumber, capacity }
    });

    res.json({ table, message: 'Table updated successfully' });

  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/tables/:id — delete table (admin only)
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;

    const existing = await prisma.table.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await prisma.table.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Table deleted successfully' });

  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/tables/:id/status — update table status
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;
    const { status } = req.body;

    if (!['free', 'occupied'].includes(status)) {
      return res.status(400).json({ message: 'Status must be free or occupied' });
    }

    const existing = await prisma.table.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const table = await prisma.table.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ table, message: `Table marked as ${status}` });

  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { 
  getTables, 
  createTable, 
  updateTable, 
  deleteTable, 
  updateTableStatus 
};