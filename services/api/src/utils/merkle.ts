import { createHash } from 'crypto';

/**
 * A simple Merkle Tree implementation for vote verification.
 * It takes a list of strings (vote hashes) and produces a root hash 
 * and proofs for inclusion.
 */
export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(leaves: string[]) {
    // Sort leaves to ensure deterministic root regardless of input order
    this.leaves = [...leaves].sort().map(leaf => this.hash(leaf));
    this.layers = [this.leaves];
    this.buildTree();
  }

  private hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private buildTree() {
    let currentLayer = this.layers[0];
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] || left; // Duplicate last leaf if odd
        nextLayer.push(this.hash(left + right));
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  public getRoot(): string {
    return this.layers[this.layers.length - 1][0] || this.hash('');
  }

  public getProof(leaf: string): string[] {
    const hashedLeaf = this.hash(leaf);
    let index = this.layers[0].indexOf(hashedLeaf);
    if (index === -1) return [];

    const proof: string[] = [];
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2 === 1;
      const pairIndex = isRightNode ? index - 1 : index + 1;

      if (pairIndex < layer.length) {
        proof.push(layer[pairIndex]);
      } else {
        // If no sibling, it was paired with itself
        proof.push(layer[index]);
      }
      index = Math.floor(index / 2);
    }
    return proof;
  }

  public static verify(leaf: string, proof: string[], root: string): boolean {
    let hash = createHash('sha256').update(leaf).digest('hex');
    for (const sibling of proof) {
      // Smallest hash goes first for deterministic pairing
      const pair = [hash, sibling].sort().join('');
      hash = createHash('sha256').update(pair).digest('hex');
    }
    return hash === root;
  }
}

/**
 * Generates a verification hash for a single vote.
 * This is what the voter sees in their UI.
 */
export function generateVoteHash(voteId: string, voterPhoneHash: string | null, timestamp: Date): string {
  const phoneHashStr = voterPhoneHash || '';
  return createHash('sha256')
    .update(`${voteId}:${phoneHashStr}:${timestamp.toISOString()}`)
    .digest('hex');
}
