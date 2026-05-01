import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const proofs = await prisma.auditProof.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log(JSON.stringify(proofs, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
