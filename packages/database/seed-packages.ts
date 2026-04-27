// packages/database/seed-packages.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const packages = [
    { name: 'Starter Pack', voteCount: 20, price: 200 },
    { name: 'Bronze Pack', voteCount: 50, price: 450 },
    { name: 'Silver Pack', voteCount: 150, price: 1200 },
    { name: 'Gold Pack', voteCount: 500, price: 3500 },
    { name: 'Mega Hustle Pack', voteCount: 2000, price: 12000 },
  ]

  console.log('Seeding Mega Vote Packages...')
  
  for (const pkg of packages) {
    await prisma.megaVotePackage.upsert({
      where: { id: pkg.name.toLowerCase().replace(/ /g, '-') },
      update: pkg,
      create: {
        id: pkg.name.toLowerCase().replace(/ /g, '-'),
        ...pkg
      }
    })
  }

  console.log('Seed complete! ✓')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
