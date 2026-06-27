require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcrypt');
const prisma = require('../src/config/db');

async function main() {
  console.log('🌱 Seeding database...');

  // Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Demo Restaurant',
      address: 'Vijayawada, Andhra Pradesh',
      phone: '9999999999',
      gstNumber: '37AABCU9603R1ZX',
      plan: 'pro'
    }
  });

  console.log('✅ Restaurant created:', restaurant.name);

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create one user per role
  const users = [
    { name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
    { name: 'Waiter Raju', email: 'waiter@demo.com', role: 'waiter' },
    { name: 'Chef Kumar', email: 'kitchen@demo.com', role: 'kitchen' },
    { name: 'Billing Priya', email: 'billing@demo.com', role: 'billing' }
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPassword,
        restaurantId: restaurant.id
      }
    });
    console.log(`✅ User created: ${user.name} (${user.role})`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });