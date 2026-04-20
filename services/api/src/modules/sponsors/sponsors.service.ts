import { prisma } from '../../index'
import { logger } from '../../utils/logger'
import { getTemporaryLink } from '../../utils/dropboxUploader'

export async function listCycleSponsors(cycleId: string) {
  logger.info('[SponsorsService] Listing sponsors for cycle', { cycleId })

  const sponsors = await prisma.sponsor.findMany({
    where: { cycleId, isActive: true },
    orderBy: { displayOrder: 'asc' }
  })

  // Resolve logos and banners from Dropbox
  const resolved = await Promise.all(sponsors.map(async (s) => {
    const logoUrl = s.logoUrl ? await getTemporaryLink(s.logoUrl) : null
    const bannerImageUrl = s.bannerImageUrl ? await getTemporaryLink(s.bannerImageUrl) : null
    
    return {
      ...s,
      logoUrl,
      bannerImageUrl
    }
  }))

  return resolved
}

export async function trackAdImpression(sponsorId: string, ipAddress?: string, voterPhoneHash?: string) {
  logger.debug('[SponsorsService] Tracking impression', { sponsorId })
  
  await prisma.adImpression.create({
    data: {
      sponsorId,
      ipAddress,
      voterPhoneHash,
      pageContext: 'mobile_app'
    }
  })
}

/**
 * Returns a single active sponsor to display as an ad for the given cycle.
 * Picks the highest-priority (lowest displayOrder value) active sponsor.
 */
export async function getActiveSponsorForAd(cycleId: string) {
  const sponsor = await prisma.sponsor.findFirst({
    where: { cycleId, isActive: true },
    orderBy: { displayOrder: 'asc' },
  })

  if (!sponsor) return null

  return {
    ...sponsor,
    logoUrl: sponsor.logoUrl ? await getTemporaryLink(sponsor.logoUrl) : null,
    bannerImageUrl: sponsor.bannerImageUrl ? await getTemporaryLink(sponsor.bannerImageUrl) : null,
  }
}