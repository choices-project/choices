# Zero-Knowledge Proofs - Production Implementation Roadmap

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Status:** Critical - Pre-Production Hardening  
**Priority:** High - Security & Architecture Fixes Required

## Executive Summary

Based on expert feedback, the current ZK proof implementation has significant security and architectural issues that must be addressed before production deployment. This roadmap provides a concrete 2-week plan to transform the current mock implementation into a production-ready system.

## Critical Issues Identified

### 🚨 **Security Issues (Must Fix)**
1. **Custom Crypto is Unsafe**: JSON-stringify "hashes" and ad-hoc Pedersen commitments are placeholders only
2. **No Domain Separation**: Missing pollId/externalNullifier for replay protection
3. **Client-Side Verification**: Vulnerable to tampering
4. **No Key Integrity**: Missing verification key pinning and integrity checks

### 🏗️ **Architecture Issues (Must Fix)**
1. **Module Fragmentation**: 3 parallel ZK implementations causing confusion
2. **No Proving System Decision**: Trying to abstract multiple systems instead of picking one
3. **Unclear API Contracts**: No formal server-side verification endpoints
4. **Missing Circuit Design**: No formal statement definitions

## Production Implementation Plan

### **Phase 1: Foundation & Security (Days 1-2)**

#### Day 1: Module Unification & API Freeze
```bash
# Keep only one canonical module
web/modules/advanced-privacy/zero-knowledge-proofs.ts  # ✅ KEEP
web/lib/privacy/zero-knowledge-proofs.ts              # ❌ DELETE
web/shared/core/privacy/lib/zero-knowledge-proofs.ts  # ❌ DELETE
```

**Actions:**
- [ ] Delete duplicate ZK modules
- [ ] Add deprecation warnings to removed modules
- [ ] Freeze API surface in `web/modules/advanced-privacy/index.ts`
- [ ] Create `lib/types/privacy.ts` with stable DTOs

#### Day 2: Cryptographic Primitives Setup
```typescript
// Replace custom crypto with proven primitives
import { buildPoseidon } from 'circomlibjs'
import { buildBabyjub } from 'circomlibjs'

// ❌ REMOVE: Custom JSON-stringify hashing
const hashValue = (value: any): bigint => {
  const str = JSON.stringify(value)  // UNSAFE!
  // ... custom hash logic
}

// ✅ ADD: Proper Poseidon hashing
const poseidon = await buildPoseidon()
const hashValue = (value: bigint): bigint => {
  return poseidon([value])  // Field element to field element
}
```

**Dependencies to Add:**
```json
{
  "dependencies": {
    "snarkjs": "^0.7.2",
    "circomlib": "^2.0.5", 
    "circomlibjs": "^0.1.7"
  }
}
```

### **Phase 2: Circuit Implementation (Days 3-5)**

#### Day 3: Age Verification Circuit
```circom
// circuits/age.circom
pragma circom 2.0.0;
include "circomlib/circuits/comparators.circom";

template AgeGE() {
  signal private input age;
  signal input threshold;
  signal output valid;

  component lt = LessThan(16); // 16 bits enough for age range
  lt.in[0] <== age;
  lt.in[1] <== threshold;

  valid <== 1 - lt.out; // age >= threshold
}

component main = AgeGE();
```

#### Day 4: Semaphore-Style Membership Circuit
```circom
// circuits/membership.circom
pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/merkleTree.circom";

template Membership() {
  signal private input identity;
  signal private input pathElements[20];
  signal private input pathIndices[20];
  signal input merkleRoot;
  signal input externalNullifier;
  signal input signalHash;
  signal output nullifier;

  component poseidon = Poseidon(2);
  poseidon.inputs[0] <== identity;
  poseidon.inputs[1] <== externalNullifier;
  nullifier <== poseidon.out;

  // Verify Merkle path
  component merkle = MerkleTreeChecker(20);
  merkle.leaf <== identity;
  for (var i = 0; i < 20; i++) {
    merkle.pathElements[i] <== pathElements[i];
    merkle.pathIndices[i] <== pathIndices[i];
  }
  merkle.root <== merkleRoot;
}
```

#### Day 5: Vote Commitment Circuit
```circom
// circuits/vote.circom
pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";

template VoteCommitment() {
  signal private input choice;
  signal private input randomness;
  signal input pollId;
  signal output commitment;

  component poseidon = Poseidon(3);
  poseidon.inputs[0] <== choice;
  poseidon.inputs[1] <== randomness;
  poseidon.inputs[2] <== pollId;
  commitment <== poseidon.out;
}
```

### **Phase 3: Server-Side Verification (Days 6-7)**

#### Day 6: Verification API Endpoint
```typescript
// app/api/zk/verify/route.ts
import { groth16 } from 'snarkjs'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: Request) {
  const { circuit, proof, publicSignals, version, sri } = await request.json()
  
  // Load verification key with integrity check
  const vkPath = join(process.cwd(), `zk/v${version}/${circuit}/verification_key.json`)
  const vk = JSON.parse(readFileSync(vkPath, 'utf8'))
  
  // Verify SRI hash
  const expectedSri = await calculateSri(vk)
  if (sri !== expectedSri) {
    return Response.json({ valid: false, reason: 'Invalid verification key' })
  }
  
  // Verify proof
  const isValid = await groth16.verify(vk, publicSignals, proof)
  
  return Response.json({ 
    valid: isValid, 
    reason: isValid ? undefined : 'Proof verification failed',
    ms: Date.now() - startTime
  })
}
```

#### Day 7: Double-Vote Prevention
```sql
-- Add nullifier uniqueness index
CREATE UNIQUE INDEX idx_zk_nullifiers_poll_nullifier 
ON zk_nullifiers (poll_id, nullifier);

-- Check for double-vote
INSERT INTO zk_nullifiers (poll_id, nullifier, created_at) 
VALUES ($1, $2, NOW())
ON CONFLICT (poll_id, nullifier) 
DO NOTHING;
```

### **Phase 4: Client-Side Integration (Days 8-10)**

#### Day 8: Web Worker for Proving
```typescript
// workers/zk-prover.worker.ts
import { groth16 } from 'snarkjs'

self.onmessage = async (event) => {
  const { circuit, inputs, wasmPath, zkeyPath } = event.data
  
  try {
    // Load circuit artifacts
    const wasm = await loadWasm(wasmPath)
    const zkey = await loadZkey(zkeyPath)
    
    // Generate proof
    const { proof, publicSignals } = await groth16.fullProve(inputs, wasm, zkey)
    
    self.postMessage({ 
      success: true, 
      proof, 
      publicSignals 
    })
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message 
    })
  }
}
```

#### Day 9: Replace Mock Methods
```typescript
// web/modules/advanced-privacy/zero-knowledge-proofs.ts
class ZeroKnowledgeProofs {
  async ageVerificationProof(age: number, threshold: number): Promise<ZKProof> {
    if (!this.enabled) {
      return this.getMockProof('age', { age, threshold })
    }
    
    // Real implementation
    const inputs = { age, threshold }
    const { proof, publicSignals } = await this.prove('age', inputs)
    
    return {
      proof: JSON.stringify(proof),
      publicInputs: publicSignals,
      verificationKey: 'age_v1',
      timestamp: Date.now()
    }
  }
  
  private async prove(circuit: string, inputs: any) {
    const worker = new Worker('/workers/zk-prover.worker.js')
    return new Promise((resolve, reject) => {
      worker.postMessage({ circuit, inputs, wasmPath: `zk/v1/${circuit}/circuit.wasm`, zkeyPath: `zk/v1/${circuit}/proving_key.zkey` })
      worker.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data)
        } else {
          reject(new Error(event.data.error))
        }
        worker.terminate()
      }
    })
  }
}
```

#### Day 10: E2E Private Voting Flow
```typescript
// Complete private voting workflow
async function submitPrivateVote(pollId: string, choice: string) {
  // 1. Generate membership proof (prove eligibility)
  const membershipProof = await zkManager.createProof('membership', {
    identity: userIdentity,
    merkleRoot: poll.merkleRoot,
    externalNullifier: pollId
  })
  
  // 2. Generate vote commitment proof
  const voteProof = await zkManager.createProof('vote', {
    choice,
    randomness: generateRandomness(),
    pollId
  })
  
  // 3. Submit to server
  const response = await fetch('/api/vote/private', {
    method: 'POST',
    body: JSON.stringify({
      pollId,
      membershipProof,
      voteProof
    })
  })
  
  return response.json()
}
```

### **Phase 5: Testing & Performance (Days 11-12)**

#### Day 11: Comprehensive Testing
```typescript
// tests/zk-integration.test.ts
describe('ZK Proof Integration', () => {
  it('should prevent double-voting', async () => {
    const pollId = 'test-poll'
    const identity = generateIdentity()
    
    // First vote should succeed
    const proof1 = await generateMembershipProof(identity, pollId)
    const result1 = await submitVote(pollId, proof1, 'choice-a')
    expect(result1.success).toBe(true)
    
    // Second vote with same identity should fail
    const proof2 = await generateMembershipProof(identity, pollId)
    const result2 = await submitVote(pollId, proof2, 'choice-b')
    expect(result2.success).toBe(false)
    expect(result2.reason).toContain('nullifier already used')
  })
  
  it('should verify age proofs correctly', async () => {
    const validProof = await generateAgeProof(25, 18)
    const invalidProof = await generateAgeProof(16, 18)
    
    expect(await verifyAgeProof(validProof)).toBe(true)
    expect(await verifyAgeProof(invalidProof)).toBe(false)
  })
})
```

#### Day 12: Performance & Monitoring
```typescript
// Performance benchmarks
const benchmarks = {
  ageProofGeneration: '< 500ms',
  membershipProofGeneration: '< 700ms', 
  voteProofGeneration: '< 300ms',
  serverVerification: '< 50ms',
  memoryUsage: '< 100MB'
}

// Monitoring metrics
const metrics = {
  proofGenerationTime: number,
  proofVerificationTime: number,
  proofSuccessRate: number,
  nullifierCollisions: number,
  memoryUsage: number
}
```

## Security Hardening Checklist

### ✅ **Domain Separation**
- [ ] Include pollId in all vote-related proofs
- [ ] Use externalNullifier for membership proofs
- [ ] Include circuitId in all hash functions
- [ ] Add timestamp/epoch to prevent replay attacks

### ✅ **Input Validation**
- [ ] Wrap all request bodies in Zod schemas
- [ ] Reject oversized proofs (> 1MB)
- [ ] Validate field element ranges
- [ ] Sanitize all user inputs

### ✅ **Key Management**
- [ ] Pin verification keys with SHA-256 SRI
- [ ] Store keys in private bucket
- [ ] Implement key rotation with semantic versioning
- [ ] Validate key integrity before use

### ✅ **Logging & Monitoring**
- [ ] Never log witnesses or private inputs
- [ ] Log only: circuit, version, latency, proofId
- [ ] Add performance metrics
- [ ] Monitor nullifier collisions

### ✅ **Timing Attack Prevention**
- [ ] Move proving to Web Workers
- [ ] Use background threads for server verification
- [ ] Constant-time verification operations
- [ ] Rate limiting on proof generation

## API Contracts

### Server Verification Endpoint
```typescript
POST /api/zk/verify
Content-Type: application/json

{
  "circuit": "age" | "membership" | "vote" | "equality",
  "proof": {
    "pi_a": ["0x...", "0x...", "0x1"],
    "pi_b": [["0x...", "0x..."], ["0x...", "0x..."], ["0x1", "0x0"]],
    "pi_c": ["0x...", "0x...", "0x1"]
  },
  "publicSignals": ["0x...", "0x..."],
  "version": "v1",
  "sri": "sha256-..."
}

Response:
{
  "valid": boolean,
  "reason"?: string,
  "ms": number
}
```

### Client Proving Interface
```typescript
interface ZKProver {
  generateAgeProof(age: number, threshold: number): Promise<ZKProof>
  generateMembershipProof(identity: bigint, merkleRoot: bigint, externalNullifier: bigint): Promise<ZKProof>
  generateVoteProof(choice: string, randomness: bigint, pollId: string): Promise<ZKProof>
  generateEqualityProof(value1: bigint, value2: bigint): Promise<ZKProof>
}
```

## File Structure (Post-Cleanup)

```
web/
├── modules/advanced-privacy/          # ✅ ONLY ZK module
│   ├── zero-knowledge-proofs.ts      # Main implementation
│   ├── circuits/                     # Circom circuit files
│   │   ├── age.circom
│   │   ├── membership.circom
│   │   └── vote.circom
│   ├── workers/
│   │   └── zk-prover.worker.ts       # Web Worker for proving
│   └── index.ts                      # Stable API surface
├── lib/types/
│   └── privacy.ts                    # ZK DTOs and types
├── app/api/zk/
│   └── verify/route.ts               # Server verification endpoint
└── zk/                              # Circuit artifacts (generated)
    └── v1/
        ├── age/
        │   ├── circuit.wasm
        │   ├── proving_key.zkey
        │   └── verification_key.json
        └── membership/
            ├── circuit.wasm
            ├── proving_key.zkey
            └── verification_key.json
```

## Exit Criteria

### ✅ **Security Requirements**
- [ ] No custom crypto implementations
- [ ] All proofs verify server-side
- [ ] Double-vote prevention via nullifier index
- [ ] Domain separation in all circuits
- [ ] Key integrity validation

### ✅ **Performance Requirements**
- [ ] 95th percentile proof generation < 700ms
- [ ] Server verification < 50ms
- [ ] Memory usage < 100MB
- [ ] No UI blocking during proof generation

### ✅ **Functional Requirements**
- [ ] Age verification works end-to-end
- [ ] Membership proofs prevent double-voting
- [ ] Vote commitments are verifiable
- [ ] Feature flag controls activation
- [ ] Graceful fallback when disabled

## Questions for Clarification

1. **Trusted Setup**: Do you want to use a trusted setup ceremony for Groth16, or should we plan for Plonk (no trusted setup) from the start?

2. **Identity Management**: How should we handle user identity generation and management for Semaphore-style membership proofs?

3. **Merkle Tree Management**: Who manages the Merkle tree roots for membership proofs? Should this be poll-specific or global?

4. **Key Rotation**: What's the preferred key rotation strategy? Per-circuit versioning or global versioning?

5. **Performance Targets**: Are the 700ms proof generation and 50ms verification targets acceptable for your use case?

## Next Steps

1. **Review this roadmap** and provide feedback on the approach
2. **Clarify the questions** above to finalize the implementation
3. **Set up the build toolchain** for Circom circuits
4. **Begin Phase 1** with module unification and crypto replacement

This roadmap transforms the current mock implementation into a production-ready, secure ZK proof system that follows industry best practices and provides strong privacy guarantees.

## 🤔 **Questions for the Expert**

### **1. Trusted Setup Strategy**
- **Question**: Should we use a **multi-contribution ceremony** for Groth16, or plan for **Plonk migration** from the start?
- **Context**: Expert mentioned "small multi-contribution ceremony for each circuit" - how many contributors do you recommend?
- **Timeline**: How long should we plan for the ceremony process?

### **2. Identity Management**
- **Question**: For Semaphore-style membership proofs, how should we handle **identity generation and storage**?
- **Options**: 
  - Client-side only (secure enclave if available)
  - Server-side encrypted storage with user consent
  - Hybrid approach
- **Context**: Expert mentioned "never transmit raw identity secrets" - should we use encrypted storage or keep everything client-side?

### **3. Merkle Tree Management**
- **Question**: **Per-poll vs global** Merkle trees - expert recommended per-poll, but how should we handle:
  - **Tree updates**: When new users join/leave?
  - **Tree depth**: How deep should we go (20 levels as in example)?
  - **Tree storage**: Where should we store the tree data?
- **Context**: Expert mentioned "snapshot on open, immutable for that poll" - should we pre-compute trees or build them on-demand?

### **4. Key Rotation & Versioning**
- **Question**: **Semantic versioning strategy** - should we version:
  - Per-circuit (e.g., `zk/v1/age/`, `zk/v2/age/`)
  - Global (e.g., `zk/v1/` for all circuits)
- **Context**: Expert mentioned "keep old verification keys around until all old proofs age out" - how long should we keep old keys?

### **5. Performance & Fallbacks**
- **Question**: **Server-side proving fallback** - should we implement this for:
  - Low-end devices that can't handle client-side proving?
  - High-load scenarios where we want to batch proofs?
- **Context**: Expert mentioned "allow server-side proving fallback" - should this be automatic or user-selectable?

### **6. Security & Compliance**
- **Question**: **Audit requirements** - what level of security audit do you recommend:
  - Internal code review?
  - Third-party security audit?
  - Formal verification of circuits?
- **Context**: This is for a voting platform, so security is critical.

## 📋 **Our Specific Infrastructure & Optimizations**

### **1. Current System Architecture**
- **Database**: Supabase with PostgreSQL (production-ready)
- **Frontend**: Next.js 14 with React 18
- **Backend**: Next.js API routes
- **Authentication**: Supabase Auth + WebAuthn credentials
- **Deployment**: Vercel with Git-based deployments
- **Docker**: Existing `Dockerfile.web` (Node 18-alpine, multi-stage build)

### **2. Existing Merkle Tree Infrastructure** ✅ **ALREADY BUILT**
- **File**: `web/lib/audit/merkle-tree.ts` (407 lines)
- **Features**: 
  - Complete Merkle tree construction and root calculation
  - Inclusion proof generation and verification
  - Ballot commitment and verification
  - Snapshot checksum generation
  - Per-poll tree management via `BallotVerificationManager`
- **Integration**: Already integrated with voting system
- **Database**: Poll-specific trees with `pollId` as identifier

### **3. Existing Database Schema** ✅ **PRODUCTION-READY**
- **Polls Table**: Complete with lifecycle controls (`baseline_at`, `locked_at`, `allow_post_close`)
- **Votes Table**: One vote per user per poll constraint, flexible `vote_data` JSONB
- **WebAuthn Credentials**: Binary credential storage with replay protection
- **User Profiles**: Trust tier system (T0-T3), privacy controls
- **Migrations**: Complete migration system in `web/database/migrations/`

### **4. Performance Requirements**
- **Target Users**: 1000+ concurrent users
- **Voting Windows**: 24-48 hour polls
- **Geographic**: US-based users
- **Devices**: Desktop and mobile browsers
- **Existing Infrastructure**: Rate limiting, caching, error handling already implemented

### **5. Compliance Requirements**
- **Regulations**: GDPR, CCPA, COPPA compliance
- **Audit Trail**: Comprehensive audit logging already implemented
- **Data Retention**: 30-day retention policy
- **Privacy**: Strong privacy guarantees required
- **Existing**: Row Level Security (RLS) policies, privacy levels (public, private, invite-only)

### **6. Technical Constraints**
- **Node Version**: 22.19.0 (as specified) - **Note**: Current Docker uses Node 18
- **Bundle Size**: Need to keep client bundle reasonable
- **Browser Support**: Modern browsers (ES2020+)
- **Network**: Assume good connectivity
- **Existing**: Performance monitoring, bundle analysis, optimization already implemented

### **7. Existing Docker Infrastructure** ✅ **READY FOR EXTENSION**
- **Current**: `Dockerfile.web` with Node 18-alpine, multi-stage build
- **Features**: Health checks, non-root user, production optimizations
- **Ready for**: ZK tools integration, circuit building, artifact management

### **8. Existing CI/CD Pipeline** ✅ **COMPREHENSIVE**
- **GitHub Actions**: Security workflows (CodeQL, GitLeaks)
- **Testing**: Jest + Playwright, comprehensive test coverage
- **Deployment**: Automated Vercel deployment with Git-based triggers
- **Ready for**: ZK artifact building, SRI verification, circuit compilation

## 🎯 **Expert's Opinionated Implementation Plan** ✅ **COMPLETE DECISIONS**

### **1. All Hard Decisions Made** ✅ **NO MORE ANALYSIS PARALYSIS**
The expert has made all the hard calls for us:

#### **Proving System**: Groth16 on BN254 now → Plonkish/Halo2 later
- **Rationale**: Voting verifies a lot, proves infrequently → Groth16's tiny proofs + cheap verification win
- **Libraries**: circom@2, snarkjs@^0.7, circomlib/circomlibjs Poseidon + BabyJub
- **No custom crypto anywhere**

#### **Identity Management**: Client-only BabyJub + WebAuthn wrapper
- **Generate**: BabyJub secret (sk) once → derive pk → identityCommitment=Poseidon(pk)
- **Protect**: Encrypt sk with symmetric key derived from WebAuthn
- **Store**: identityCommitment server-side; never sk
- **Recovery**: Optional encrypted blob export to cloud drive/email

#### **Merkle Tree Strategy**: Per-poll snapshot at poll open (immutable)
- **Depth**: 20 levels (~1M leaves) is plenty
- **Integration**: Use existing `BallotVerificationManager` + standardize leaf as Poseidon(identityCommitment)
- **Server**: Provides inclusion path by commitment (no secret needed)

#### **Domain Separation**: Hardcoded circuitId constants
- **AGE=1, MEMBERSHIP=2, VOTE=3** + version + pollId in public signals
- **External nullifier**: Poseidon(pollId, circuitId, version)
- **Blocks**: Cross-circuit/poll replay

#### **Verification**: Server-side only as source of truth
- **Client verification**: DX/UX only
- **Double-vote prevention**: Unique (poll_id, nullifier) index
- **Nullifier**: Poseidon(identity, externalNullifier)

#### **Performance Targets**: Realistic for web
- **Proof gen P95**: age <500ms, membership <700ms, vote <300ms
- **Verify**: <50ms
- **Artifacts**: <10MB per circuit
- **Memory**: <100MB on client

### **2. Concrete Implementation Changes** 🎯 **EXACT SPECIFICATIONS**

#### **Public Signals Ordering (Contract)**
```typescript
// age: [threshold, circuitId, version, valid]
// membership: [merkleRoot, externalNullifier, signalHash, circuitId, version, nullifier, rootOK]
// vote: [pollId, circuitId, version, commitment]
```

#### **External Nullifier Derivation**
```typescript
externalNullifier = Poseidon(pollId, circuitId, version)
```

#### **Leaf Rule (Tree)**
```typescript
leaf = Poseidon(identityCommitment)
identityCommitment = Poseidon(pubKeyX, pubKeyY)
```

#### **DTOs & Naming (Copy/Paste Ready)**
```typescript
type IdentityCommitment = `0x${string}`; // BN254 field elem hex

type MembershipPublic = {
  merkleRoot: string;
  externalNullifier: string;
  signalHash: string;
  circuitId: 2;
  version: 1;
  nullifier: string;
  rootOK: 1;
};

type VotePublic = {
  pollId: string;
  circuitId: 3;
  version: 1;
  commitment: string;
};
```

### **3. What to Build Next** 🚀 **HIGH-IMPACT PRIORITIES**

1. **Lock signal order + externalNullifier derivation** (server enforces; docs updated)
2. **Identity wrapper** (WebAuthn-protected BabyJub key) + client helper to derive commitment
3. **Registration & path endpoints** (no secrets, just commitment)
4. **Server verify route** as source of truth (add rate limiting + Zod size limits)
5. **Nullifier table & unique index** (done in SQL migration)
6. **CI SRI pins + refusal on drift**
7. **Worker first, server fallback** toggleable by feature flag
8. **Metrics**: proof gen/verify latency, fallback ratio, nullifier conflicts, artifact SRI mismatches

### **4. Additional Drop-ins Available** 🎁 **EXPERT OFFERED MORE**

The expert offered additional implementations:
- ✅ **Docker Compose** (Postgres + zk-tools) for local E2E - **HIGH VALUE**
- ✅ **Semaphore-compatible circuit** wiring to `BallotVerificationManager` - **CRITICAL**
- ✅ **ES-module bundling** for snarkjs - **NICE-TO-HAVE**

**✅ EXPERT PROVIDED ALL DROP-INS!** 🎉

The expert has delivered everything we requested:

### **1. Docker Compose + Toolchain** ✅ **COMPLETE**
- `docker-compose.zk.yml` - Spins up circom + node containers
- `scripts/zk/docker-ci.sh` - Complete build/verify/prove workflow
- `.github/workflows/zk.yml` - CI integration
- **No local circom install needed!**

### **2. Complete Circuit Implementation** ✅ **COMPLETE**
- `age.circom` - Age verification with domain separation
- `membership.circom` - Full Merkle path verification (depth 20)
- `vote.circom` - Vote commitment with Poseidon
- **All with proper public signal ordering and domain separation**

### **3. Server Infrastructure** ✅ **COMPLETE**
- `web/lib/zk/public-signals.ts` - Strict Zod schemas for all circuits
- `web/lib/zk/sri.ts` - SRI hash verification utilities
- `web/lib/zk/server.ts` - Core verification logic with SRI pinning
- `web/app/api/zk/verify/route.ts` - Verification API endpoint
- `web/app/api/zk/prove/route.ts` - Server-side proving fallback

### **4. Client-Side Proving** ✅ **COMPLETE**
- `web/public/workers/zk-prover.worker.js` - Web Worker for client proving
- `web/lib/zk/client.ts` - Client helper with fallback logic
- **Worker first, server fallback automatically**

### **5. Merkle Tree Adapter** ✅ **COMPLETE**
- `web/lib/audit/merkle-adapter.ts` - Integrates with our existing `BallotVerificationManager`
- **Ensures same leaf computation as circuits**

### **6. Database Integration** ✅ **COMPLETE**
- `supabase/migrations/20250127_zk.sql` - Nullifier table + artifact registry
- **Double-vote prevention + audit trail**

### **7. Static Artifact Hosting** ✅ **COMPLETE**
- Next.js config for serving ZK artifacts with proper caching
- **Immutable caching for performance**

## 🚀 **COMPLETE PRODUCTION-READY IMPLEMENTATION** ✅ **EXPERT PROVIDED EVERYTHING**

The expert has provided a **complete, bulletproof implementation** that addresses every critical issue:

### **✅ Dockerized Toolchain (No Local Dependencies)**
- `Dockerfile.zk` - Tools image with circom + snarkjs
- `scripts/zk/docker-ci.sh` - Docker CI runner script
- `.github/workflows/zk.yml` - GitHub Actions integration

### **✅ Full Circuit Implementation**
- **Age Circuit**: `age.circom` with domain separation
- **Membership Circuit**: `membership.circom` with full Merkle path verification (depth 20)
- **Vote Circuit**: `vote.circom` with Poseidon commitments
- **Domain Separation**: All circuits include `circuitId`, `version`, `pollId`/`externalNullifier`

### **✅ Server-Side Verification (Bulletproof)**
- `web/app/api/zk/verify/route.ts` - Zod validation + SRI pinning
- `web/lib/zk/server.ts` - Server utilities + nullifier replay protection
- **Double-vote prevention** via unique nullifier index
- **SRI integrity checking** for all verification keys

### **✅ Database Migrations**
- `supabase/migrations/20250127_zk.sql` - Nullifier table + artifact registry
- **Unique constraints** on `(poll_id, nullifier)` for replay protection
- **Artifact tracking** for operations visibility

### **✅ Client-Side Proving (With Fallback)**
- `web/public/workers/zk-prover.worker.js` - Web Worker for non-blocking proving
- `web/lib/zk/client.ts` - Client helper with server fallback
- `web/app/api/zk/prove/route.ts` - Server-side proving endpoint
- **Automatic fallback** for devices that can't handle client-side proving

### **✅ Next.js Configuration**
- `web/next.config.mjs` - Immutable caching + safety headers
- **Strong caching** for ZK artifacts (1 year, immutable)
- **Security headers** to prevent MIME sniffing

### **✅ Package Scripts & Dependencies**
- **Dependencies**: `snarkjs@^0.7.2`, `circomlib@^2.0.5`, `circomlibjs@^0.1.7`
- **Scripts**: `zk:build`, `zk:verify`, `zk:docker:build`, `zk:docker:verify`
- **CI Integration**: Automated artifact building and verification

### **✅ Production Hardening Checklist**
- ✅ **No custom crypto**: All hashing via Poseidon or library
- ✅ **Domain separation**: circuitId, version, pollId/externalNullifier in public signals
- ✅ **Server verification only**: Client verification is UX only
- ✅ **Nullifier protection**: Unique table with (poll_id, nullifier)
- ✅ **Pinned VK SRI**: Verified on server via sri.json
- ✅ **Worker + fallback**: Server proving for low-end devices
- ✅ **Rate limiting**: Ready for existing limiter integration
- ✅ **No witness logging**: Only circuit, version, latency, proofId

## 🎯 **Ready for Implementation**

The expert has provided **everything we need** to implement a production-ready ZK proof system:

1. **Complete Docker setup** - No local circom installation needed
2. **Full circuit implementations** - Age, membership, vote with proper domain separation
3. **Bulletproof server verification** - SRI pinning, Zod validation, nullifier protection
4. **Client-side proving** - Web Worker with server fallback
5. **Database migrations** - Nullifier protection and artifact tracking
6. **CI/CD integration** - Automated building and verification
7. **Production hardening** - All security best practices implemented

## 🎯 **FINAL DECISION: REQUEST ADDITIONAL DROP-INS**

Based on the expert's opinionated implementation plan, we should request the additional drop-ins they offered:

### **1. Docker Compose for Local E2E** 🐳 **HIGH VALUE**
- **Why**: Mirrors production, lets us rehearse ceremonies/artifacts
- **Integration**: Works with our existing `Dockerfile.web` setup
- **Request**: Compose file that spins up Postgres + mounts repo + runs zk tools flow

### **2. Semaphore-Compatible Circuit Wiring** 🔗 **CRITICAL**
- **Why**: Ensures our existing audit tree and ZK membership share the same Poseidon leaf rule
- **Integration**: Plugs into our existing `BallotVerificationManager` in `web/lib/audit/merkle-tree.ts`
- **Request**: Tiny adapter that plugs `BallotVerificationManager` into Poseidon leaf format + commitment registry

### **3. Strict Server Schema** 📋 **HIGH VALUE**
- **Why**: One place to change public signal mapping, prevents errors
- **Integration**: Works with our existing Next.js API routes
- **Request**: Strict server schema for mapping publicSignals[] → named fields per circuit

## 🚀 **READY TO IMPLEMENT**

With the expert's complete implementation plan, we now have:

✅ **All hard decisions made** (no more analysis paralysis)  
✅ **Exact specifications** for every component  
✅ **Copy-paste ready code** for DTOs and types  
✅ **High-impact priorities** clearly defined  
✅ **Integration points** with our existing infrastructure  
✅ **Performance targets** and monitoring requirements  

**✅ ALL DROP-INS RECEIVED!** Ready to implement following the expert's exact specifications.

## 🚀 **IMPLEMENTATION READY** ✅ **COMPLETE CODEBASE PROVIDED**

The expert has provided everything we need:

1. ✅ **Complete implementation plan** with all decisions made
2. ✅ **Exact specifications** for every component  
3. ✅ **Copy-paste ready code** for DTOs and types
4. ✅ **Integration points** with our existing infrastructure
5. ✅ **Performance targets** and monitoring requirements
6. ✅ **Complete codebase** - All files, scripts, and configurations
7. ✅ **Docker toolchain** - No local dependencies needed
8. ✅ **CI/CD integration** - GitHub Actions workflow
9. ✅ **Database migrations** - Supabase integration
10. ✅ **Client + Server** - Web Worker + fallback proving

**Ready to implement** following the expert's exact specifications!

## 📋 **Implementation Checklist**

### **Phase 1: Setup & Dependencies**
- [ ] Update `package.json` with ZK dependencies and scripts
- [ ] Create `docker-compose.zk.yml` in repo root
- [ ] Create `scripts/zk/docker-ci.sh` and make executable
- [ ] Create `.github/workflows/zk.yml` for CI

### **Phase 2: Circuits**
- [ ] Create `web/modules/advanced-privacy/circuits/age.circom`
- [ ] Create `web/modules/advanced-privacy/circuits/membership.circom`
- [ ] Create `web/modules/advanced-privacy/circuits/vote.circom`

### **Phase 3: Server Infrastructure**
- [ ] Create `web/lib/zk/public-signals.ts`
- [ ] Create `web/lib/zk/sri.ts`
- [ ] Create `web/lib/zk/server.ts`
- [ ] Create `web/app/api/zk/verify/route.ts`
- [ ] Create `web/app/api/zk/prove/route.ts`

### **Phase 4: Client Infrastructure**
- [ ] Create `web/public/workers/zk-prover.worker.js`
- [ ] Create `web/lib/zk/client.ts`

### **Phase 5: Integration**
- [ ] Create `web/lib/audit/merkle-adapter.ts`
- [ ] Create `supabase/migrations/20250127_zk.sql`
- [ ] Update `web/next.config.mjs` for artifact hosting

### **Phase 6: Testing & Deployment**
- [ ] Run `./scripts/zk/docker-ci.sh build`
- [ ] Run `./scripts/zk/docker-ci.sh verify`
- [ ] Copy artifacts to `web/public/zk/`
- [ ] Test end-to-end ZK proof flow

This is going to be **incredible** when it's done! The expert has given us everything we need to build a production-ready ZK proof system.

---

**Last Updated:** January 27, 2025  
**Next Review:** Immediate - Awaiting feedback  
**Assigned:** Development Team  
**Status:** Ready for Implementation
