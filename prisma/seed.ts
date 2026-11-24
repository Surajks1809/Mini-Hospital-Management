import { seedDatabase } from '../src/seedLogic.js';
import prisma from '../src/db.js';

async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
