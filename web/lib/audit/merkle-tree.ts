// ============================================================================
// PHASE 1: MERKLE TREE IMPLEMENTATION FOR AUDITABILITY
// ============================================================================
// Agent A1 - Infrastructure Specialist
// 
// This module implements Merkle trees for cryptographic auditability of
// ballots and inclusion proofs for the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Merkle tree construction and root calculation
// - Inclusion proof generation and verification
// - Ballot commitment and verification
// - Snapshot checksum generation
// - Replay kit foundation
// 
// Created: January 15, 2025
// Status: Phase 1 Implementation
// ============================================================================

import { createHash } from 'crypto';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type MerkleNode = {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: any;
  isLeaf: boolean;
}

export type MerkleProof = {
  leaf: string;
  path: string[];
  indices: number[]; // 0 for left, 1 for right
  root: string;
}

export type BallotCommitment = {
  ballotId: string;
  hash: string;
  timestamp: Date;
  pollId: string;
  merkleProof?: MerkleProof;
}

export type SnapshotChecksum = {
  pollId: string;
  candidateIds: string[];
  ballotsHash: string;
  rounds: any;
  checksum: string;
  merkleRoot: string;
  timestamp: Date;
}

export type ReplayData = {
  pollId: string;
  ballots: BallotCommitment[];
  merkleRoot: string;
  methodology: string;
  timestamp: Date;
}

// ============================================================================
// MERKLE TREE CLASS
// ============================================================================

export class MerkleTree {
  private leaves: string[] = [];
  private root: MerkleNode | null = null;
  private pollId: string;

  constructor(pollId: string) {
    this.pollId = pollId;
  }

  // ============================================================================
  // BALLOT MANAGEMENT
  // ============================================================================

  addBallot(ballotId: string, ballotData: any): BallotCommitment {
    const hash = this.hashBallot(ballotId, ballotData);
    this.leaves.push(hash);
    this.root = null; // Invalidate cached root

    return {
      ballotId,
      hash,
      timestamp: new Date(),
      pollId: this.pollId
    };
  }

  addBallots(ballots: Array<{ id: string; data: any }>): BallotCommitment[] {
    const commitments: BallotCommitment[] = [];
    
    ballots.forEach(ballot => {
      const commitment = this.addBallot(ballot.id, ballot.data);
      commitments.push(commitment);
    });

    return commitments;
  }

  // ============================================================================
  // MERKLE TREE CONSTRUCTION
  // ============================================================================

  getRoot(): string {
    if (!this.root) {
      this.root = this.buildTree(this.leaves);
    }
    return this.root.hash;
  }

  private buildTree(leaves: string[]): MerkleNode {
    if (leaves.length === 0) {
      return this.createLeafNode('');
    }

    if (leaves.length === 1) {
      return this.createLeafNode(leaves[0] || '');
    }

    // Build tree level by level
    let currentLevel = leaves.map(leaf => this.createLeafNode(leaf));
    
    while (currentLevel.length > 1) {
      const nextLevel: MerkleNode[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate last node if odd number
        
        if (left && right) {
          const parent = this.createParentNode(left, right);
          nextLevel.push(parent);
        }
      }
      
      currentLevel = nextLevel;
    }

    return currentLevel[0] || this.createLeafNode('');
  }

  private createLeafNode(data: string): MerkleNode {
    return {
      hash: data,
      data,
      isLeaf: true
    };
  }

  private createParentNode(left: MerkleNode, right: MerkleNode): MerkleNode {
    const combined = left.hash + right.hash;
    const hash = MerkleTree.hash(combined);
    
    return {
      hash,
      left,
      right,
      isLeaf: false
    };
  }

  // ============================================================================
  // INCLUSION PROOF GENERATION
  // ============================================================================

  generateProof(ballotId: string, ballotData: any): MerkleProof | null {
    const leafHash = this.hashBallot(ballotId, ballotData);
    const leafIndex = this.leaves.indexOf(leafHash);
    
    if (leafIndex === -1) {
      return null;
    }

    const path: string[] = [];
    const indices: number[] = [];
    
    this.buildProofPath(this.root!, leafIndex, path, indices);
    
    return {
      leaf: leafHash,
      path,
      indices,
      root: this.getRoot()
    };
  }

  private buildProofPath(
    node: MerkleNode, 
    leafIndex: number, 
    path: string[], 
    indices: number[]
  ): void {
    if (node.isLeaf) {
      return;
    }

    const leftSize = this.getLeafCountFromNode(node.left!);
    
    if (leafIndex < leftSize) {
      // Leaf is in left subtree
      path.push(node.right!.hash);
      indices.push(1); // Right sibling
      this.buildProofPath(node.left!, leafIndex, path, indices);
    } else {
      // Leaf is in right subtree
      path.push(node.left!.hash);
      indices.push(0); // Left sibling
      this.buildProofPath(node.right!, leafIndex - leftSize, path, indices);
    }
  }

  private getLeafCountFromNode(node: MerkleNode): number {
    if (node.isLeaf) {
      return 1;
    }
    
    return this.getLeafCountFromNode(node.left!) + this.getLeafCountFromNode(node.right!);
  }

  // ============================================================================
  // PROOF VERIFICATION
  // ============================================================================

  static verifyProof(proof: MerkleProof): boolean {
    let currentHash = proof.leaf;
    
    for (let i = 0; i < proof.path.length; i++) {
      const siblingHash = proof.path[i];
      const isRight = proof.indices[i] === 1;
      
      if (isRight) {
        currentHash = MerkleTree.hash(currentHash + siblingHash);
      } else {
        currentHash = MerkleTree.hash(siblingHash + currentHash);
      }
    }
    
    return currentHash === proof.root;
  }

  // ============================================================================
  // SNAPSHOT CHECKSUM GENERATION
  // ============================================================================

  generateSnapshotChecksum(input: {
    pollId: string;
    candidateIds: string[];
    ballotsHash: string;
    rounds: any;
  }): SnapshotChecksum {
    const payload = JSON.stringify({
      pollId: input.pollId,
      candidates: input.candidateIds.sort(),
      ballotsHash: input.ballotsHash,
      rounds: input.rounds
    });

    const checksum = MerkleTree.hash(payload);
    const merkleRoot = this.getRoot();

    return {
      pollId: input.pollId,
      candidateIds: input.candidateIds,
      ballotsHash: input.ballotsHash,
      rounds: input.rounds,
      checksum,
      merkleRoot,
      timestamp: new Date()
    };
  }

  // ============================================================================
  // REPLAY KIT FOUNDATION
  // ============================================================================

  generateReplayData(methodology: string): ReplayData {
    const ballots: BallotCommitment[] = this.leaves.map((hash, index) => ({
      ballotId: `ballot_${index}`,
      hash,
      timestamp: new Date(),
      pollId: this.pollId
    }));

    return {
      pollId: this.pollId,
      ballots,
      merkleRoot: this.getRoot(),
      methodology,
      timestamp: new Date()
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private hashBallot(ballotId: string, ballotData: any): string {
    const data = JSON.stringify({
      ballotId,
      pollId: this.pollId,
      data: ballotData,
      timestamp: new Date().toISOString()
    });
    
    return MerkleTree.hash(data);
  }

  private static hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  getLeafCount(): number {
    return this.leaves.length;
  }

  getLeaves(): string[] {
    return [...this.leaves];
  }

  clear(): void {
    this.leaves = [];
    this.root = null;
  }
}

// ============================================================================
// BALLOT VERIFICATION MANAGER
// ============================================================================

export class BallotVerificationManager {
  private trees: Map<string, MerkleTree> = new Map();

  createTree(pollId: string): MerkleTree {
    const tree = new MerkleTree(pollId);
    this.trees.set(pollId, tree);
    return tree;
  }

  getTree(pollId: string): MerkleTree | null {
    return this.trees.get(pollId) || null;
  }

  addBallot(pollId: string, ballotId: string, ballotData: any): BallotCommitment {
    let tree = this.getTree(pollId);
    if (!tree) {
      tree = this.createTree(pollId);
    }
    
    return tree.addBallot(ballotId, ballotData);
  }

  generateProof(pollId: string, ballotId: string, ballotData: any): MerkleProof | null {
    const tree = this.getTree(pollId);
    if (!tree) {
      return null;
    }
    
    return tree.generateProof(ballotId, ballotData);
  }

  verifyBallotInclusion(
    pollId: string, 
    ballotId: string, 
    ballotData: any, 
    expectedRoot: string
  ): boolean {
    const proof = this.generateProof(pollId, ballotId, ballotData);
    if (!proof) {
      return false;
    }
    
    return MerkleTree.verifyProof(proof) && proof.root === expectedRoot;
  }

  getPollRoot(pollId: string): string | null {
    const tree = this.getTree(pollId);
    return tree ? tree.getRoot() : null;
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

export function snapshotChecksum(input: {
  pollId: string;
  candidateIds: string[];
  ballotsHash: string;
  rounds: any;
}): string {
  const payload = JSON.stringify({
    pollId: input.pollId,
    candidates: input.candidateIds.sort(),
    ballotsHash: input.ballotsHash,
    rounds: input.rounds
  });
  
  return createHash('sha256').update(payload).digest('hex');
}

export function generateBallotHash(ballotId: string, pollId: string, ballotData: any): string {
  const data = JSON.stringify({
    ballotId,
    pollId,
    data: ballotData,
    timestamp: new Date().toISOString()
  });
  
  return createHash('sha256').update(data).digest('hex');
}

export function verifyMerkleProof(proof: MerkleProof): boolean {
  return MerkleTree.verifyProof(proof);
}

// ============================================================================
// EXPORTED CLASSES
// ============================================================================

export default MerkleTree;
