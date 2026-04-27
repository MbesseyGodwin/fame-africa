// services/api/src/modules/payments/payments.service.ts

import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/errors'

export class PaymentsService {
  static async getMegaVotePackages() {
    return prisma.megaVotePackage.findMany({
      where: { isActive: true },
      orderBy: { voteCount: 'asc' }
    })
  }

  static async initializeTransaction(data: { 
    userId: string, 
    participantId?: string, 
    amount: number, 
    currency: string,
    type: 'MEGA_VOTE' | 'REGISTRATION_FEE',
    reference: string,
    metadata?: any
  }) {
    return prisma.transaction.create({
      data: {
        userId: data.userId,
        participantId: data.participantId,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        reference: data.reference,
        status: 'PENDING',
        provider: 'FLUTTERWAVE',
        metadata: data.metadata
      }
    })
  }

  static async handleSuccessfulPayment(reference: string, providerAmount?: number) {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { user: true }
    })

    if (!transaction) return null
    if (transaction.status === 'SUCCESS' && transaction.isFulfilled) return transaction

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'SUCCESS',
        updatedAt: new Date()
      }
    })

    // Action based on type
    if (transaction.type === 'MEGA_VOTE' && !transaction.isFulfilled) {
      const package_ = transaction.metadata ? (transaction.metadata as any).voteCount : 0
      if (transaction.participantId && package_ > 0) {
        // Award votes to participant
        await prisma.participant.update({
          where: { id: transaction.participantId },
          data: {
            totalVotes: { increment: package_ }
          }
        })

        // Also add to daily tally
        const today = new Date()
        today.setHours(0,0,0,0)
        
        await prisma.dailyVoteTally.upsert({
          where: { 
            participantId_voteDate: { 
              participantId: transaction.participantId, 
              voteDate: today 
            } 
          },
          update: { voteCount: { increment: package_ } },
          create: {
            participantId: transaction.participantId,
            voteDate: today,
            voteCount: package_,
            dayNumber: 1, // Simplified
            cycleId: (await prisma.participant.findUnique({ where: { id: transaction.participantId } }))?.cycleId || ''
          }
        })

        // Mark as fulfilled
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { isFulfilled: true }
        })
      }
    } else if (transaction.type === 'REGISTRATION_FEE' && !transaction.isFulfilled) {
       // Registration fee fulfillment logic usually in confirmPaymentAndActivate
       // We can call it here too if needed
    }

    return updatedTransaction
  }
}
