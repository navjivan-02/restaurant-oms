const prisma = require('../config/db');

// GET /api/menu — fetch all categories with items
const getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.user;

    const categories = await prisma.menuCategory.findMany({
      where: { 
        restaurantId,
        isActive: true 
      },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({ categories });

  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/menu/categories — add category (admin only)
const createCategory = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { name, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        sortOrder: sortOrder || 0,
        restaurantId
      }
    });

    res.status(201).json({ category, message: 'Category created successfully' });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/menu/items — add menu item (admin only)
const createItem = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { name, description, price, isVeg, categoryId } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'Name, price and categoryId are required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        isVeg: isVeg ?? true,
        categoryId,
        restaurantId
      }
    });

    res.status(201).json({ item, message: 'Menu item created successfully' });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/menu/items/:id — update item (admin only)
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;
    const { name, description, price, isVeg, categoryId } = req.body;

    // Make sure item belongs to this restaurant
    const existing = await prisma.menuItem.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: { name, description, price, isVeg, categoryId }
    });

    res.json({ item, message: 'Menu item updated successfully' });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/menu/items/:id — delete item (admin only)
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;

    const existing = await prisma.menuItem.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Menu item deleted successfully' });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/menu/items/:id/availability — toggle availability
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;

    const existing = await prisma.menuItem.findFirst({
      where: { id: parseInt(id), restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: { isAvailable: !existing.isAvailable }
    });

    res.json({ 
      item, 
      message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}` 
    });

  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { 
  getMenu, 
  createCategory, 
  createItem, 
  updateItem, 
  deleteItem, 
  toggleAvailability 
};