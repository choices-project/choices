/**
 * @jest-environment node
 */
import { ZeroKnowledgeProofManager } from '@/lib/privacy/zero-knowledge-proofs';

describe('ZeroKnowledgeProofManager', () => {
  it('updates config via explicit assignments and preserves existing fields', () => {
    const mgr = new ZeroKnowledgeProofManager({
      curve: 'bn254',
      hashFunction: 'poseidon',
      circuitSize: 2048,
    });
    // update single field
    mgr.updateConfig({ circuitSize: 4096 });
    // @ts-expect-no-error - access private via any for test introspection
    const cfg = (mgr as any).config;
    expect(cfg.circuitSize).toBe(4096);
    expect(cfg.curve).toBe('bn254');
    expect(cfg.hashFunction).toBe('poseidon');
  });

  it('generates and verifies proof with consistent fingerprint', async () => {
    const mgr = new ZeroKnowledgeProofManager();
    const proof = await mgr.generateVotingProof(1, 'poll-1', 'user-1');
    const ok = await mgr.verifyVotingProof(proof, 'poll-1');
    expect(ok).toBe(true);
  });
});


