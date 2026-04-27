import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const participants = await prisma.participant.findMany({
    include: { videos: true }
  })
  console.log('Total Participants:', participants.length)
  participants.forEach(p => {
    console.log(`Participant: ${p.displayName} (${p.id}) - Videos: ${p.videos.length}`)
    p.videos.forEach(v => console.log(`  - ${v.url}`))
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
