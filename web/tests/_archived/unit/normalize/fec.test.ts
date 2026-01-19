/**
 * @jest-environment node
 */
import { toFECMinimal, type FECTotalsWire } from '@/lib/normalize/fec';

describe('FEC normalization', () => {
  it('builds minimal model and conditionally includes optional numeric fields', () => {
    const wire: FECTotalsWire = {
      cycle: 2024,
      total_receipts: 1000,
      cash_on_hand_end_period: null,
      total_disbursements: null,
      debts_owed_by_committee: 50,
    };
    const model = toFECMinimal('person-1', 'C123', wire);
    expect(model).toMatchObject({
      person_id: 'person-1',
      fec_candidate_id: 'C123',
      election_cycle: 2024,
      data_source: 'fec_api',
      total_receipts: 1000,
      debts_owed: 50,
    });
    // ensure null/undefined are not copied
    expect('cash_on_hand' in model).toBe(false);
    expect('total_disbursements' in model).toBe(false);
  });
});


