// services/api/src/modules/audit/audit.service.ts

import { prisma } from '../../index';
import { logger } from '../../utils/logger';
import { MerkleTree, generateVoteHash } from '../../utils/merkle';
import { createWalletClient, http, publicActions, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as viemChains from 'viem/chains';

function getTargetChain(chainIdStr?: string) {
  if (!chainIdStr) return viemChains.baseSepolia;
  const targetId = Number(chainIdStr);
  // Scan all viem chains for matching ID
  const found = Object.values(viemChains).find((c: any) => c?.id === targetId);
  return (found as any) || viemChains.baseSepolia;
}


export async function sealDailyVotes(cycleId?: string, date?: Date) {
  const targetDate = date || getYesterdayDate();
  logger.info(`Sealing votes for date ${targetDate.toISOString().split('T')[0]}...`);

  const activeCycles = cycleId
    ? [await prisma.competitionCycle.findUnique({ where: { id: cycleId } })]
    : await prisma.competitionCycle.findMany({ where: { status: 'VOTING_OPEN' } });

  for (const cycle of activeCycles) {
    if (!cycle) continue;

    // 1. Get all verified votes for this cycle and date
    const votes = await prisma.vote.findMany({
      where: {
        cycleId: cycle.id,
        voteDate: targetDate,
        verifiedAt: { not: null },
      },
      select: {
        id: true,
        voterPhoneHash: true,
        createdAt: true,
      },
    });

    if (votes.length === 0) {
      logger.info(`No votes found for cycle ${cycle.id} on ${targetDate.toISOString().split('T')[0]}. Skipping seal.`);
      continue;
    }

    // 2. Generate vote hashes and Merkle Root
    const voteHashes = votes.map(v => generateVoteHash(v.id, v.voterPhoneHash, v.createdAt));
    const tree = new MerkleTree(voteHashes);
    const root = tree.getRoot();

    // 3. Optional: Broadcast to EVM Chain via Viem
    let txHash: string | undefined = undefined;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;

    if (privateKey && privateKey.startsWith('0x') && rpcUrl) {
      try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        const chain = getTargetChain(process.env.BLOCKCHAIN_CHAIN_ID);
        
        const client = createWalletClient({
          account,
          chain,
          transport: http(rpcUrl),
        }).extend(publicActions);

        // We send a 0-value transaction with the root hash as data payload
        const hash = await client.sendTransaction({
          to: account.address, // send to self
          value: 0n,
          data: toHex(root),
          chain, // explicit chain required by viem type definitions
        });

        txHash = hash;
        logger.info(`Successfully anchored Merkle root on-chain. TX: ${txHash}`);
      } catch (err) {
        logger.error('Failed to broadcast merkle root to blockchain', err);
      }
    } else {
      logger.info('Skipping blockchain anchor — BLOCKCHAIN_PRIVATE_KEY or BLOCKCHAIN_RPC_URL not configured properly.');
    }

    // 4. Save Audit Proof
    const dayNumber = getDayNumber(cycle.votingOpen, targetDate);

    await prisma.auditProof.upsert({
      where: {
        cycleId_auditDate: {
          cycleId: cycle.id,
          auditDate: targetDate,
        },
      },
      create: {
        cycleId: cycle.id,
        dayNumber,
        auditDate: targetDate,
        merkleRoot: root,
        voteCount: votes.length,
        txHash,
        proofData: { hashes: voteHashes }, // In production, we might store this in a file storage or cloud
      },
      update: {
        merkleRoot: root,
        voteCount: votes.length,
        txHash,
        proofData: { hashes: voteHashes },
      },
    });

    logger.info(`Audit proof sealed for cycle ${cycle.id}. Root: ${root}`);
  }
}

export async function getVoteVerificationProof(voteId: string) {
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
  });

  if (!vote || !vote.verifiedAt) {
    throw new Error('Vote not found or not yet verified');
  }

  const auditProof = await prisma.auditProof.findUnique({
    where: {
      cycleId_auditDate: {
        cycleId: vote.cycleId,
        auditDate: vote.voteDate,
      },
    },
  });

  if (!auditProof) {
    return {
      status: 'PENDING',
      message: 'Vote is recorded but the daily audit ledger has not been sealed yet. Check back tomorrow.'
    };
  }

  const voteHash = generateVoteHash(vote.id, vote.voterPhoneHash, vote.createdAt);
  const proofData = auditProof.proofData as { hashes: string[] };

  const tree = new MerkleTree(proofData.hashes);
  const proof = tree.getProof(voteHash);

  return {
    status: 'VERIFIED',
    voteHash,
    merkleRoot: auditProof.merkleRoot,
    txHash: auditProof.txHash,
    proof,
    auditDate: auditProof.auditDate,
    dayNumber: auditProof.dayNumber,
  };
}

function getYesterdayDate(): Date {
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return yesterday;
}

function getDayNumber(votingOpen: Date, targetDate: Date): number {
  const open = new Date(Date.UTC(votingOpen.getUTCFullYear(), votingOpen.getUTCMonth(), votingOpen.getUTCDate()));
  const target = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
  return Math.floor((target.getTime() - open.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
