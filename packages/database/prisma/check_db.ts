import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const tallies = await prisma.dailyVoteTally.count()
  const eliminations = await prisma.elimination.count()
  const participants = await prisma.participant.count()
  const activeCycle = await prisma.competitionCycle.findFirst({ where: { status: 'VOTING_OPEN' } })
  
  console.log({
    tallies,
    eliminations,
    participants,
    activeCycle: activeCycle?.cycleName,
    activeCycleId: activeCycle?.id
  })
}
check()
