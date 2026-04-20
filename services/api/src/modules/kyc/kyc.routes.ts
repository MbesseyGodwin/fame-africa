import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { prisma } from '../../index'

export const kycRouter = Router()

kycRouter.post('/submit', authenticate, async (req: any, res) => {
  try {
    const { bvn, idType, idNumber, idImageUrl } = req.body
    const userId = req.user.id

    const existingKyc = await prisma.kycRecord.findUnique({
      where: { userId }
    })

    // Only block if already approved
    if (existingKyc && existingKyc.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'KYC already verified and locked' })
    }

    const kyc = await prisma.kycRecord.upsert({
      where: { userId },
      update: { bvn, idType, idNumber, idImageUrl, status: 'PENDING' },
      create: { userId, bvn, idType, idNumber, idImageUrl, status: 'PENDING' }
    })

    res.json({ success: true, data: kyc })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit KYC', error })
  }
})

kycRouter.get('/me', authenticate, async (req: any, res) => {
  try {
    const kyc = await prisma.kycRecord.findUnique({
      where: { userId: req.user.id }
    })
    res.json({ success: true, data: kyc })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving KYC' })
  }
})
