const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const proofs = await prisma.auditProof.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(proofs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
