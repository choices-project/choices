/**
 * @jest-environment node
 */
import { transformCongressGovBill } from '@/lib/integrations/congress-gov/transformers';

describe('Congress.gov transformers', () => {
  it('includes conditional shortTitle and summary fields without helper', () => {
    const bill = {
      billId: 'hr-1-118',
      title: 'An Act to Do Things',
      shortTitle: 'Do Things Act',
      billType: 'hr',
      number: '1',
      congress: 118,
      introducedDate: '2025-01-01',
      sponsor: { bioguideId: 'S001', fullName: 'Jane Smith', party: 'I', state: 'CA' },
      subjects: ['governance'],
      summary: { text: 'This bill does things.' },
      url: 'https://congress.gov/bill/hr1',
    };
    const out = transformCongressGovBill(bill as any);
    expect(out).toMatchObject({
      id: 'hr-1-118',
      title: 'An Act to Do Things',
      shortTitle: 'Do Things Act',
      summary: 'This bill does things.',
      source: 'congress-gov',
    });
  });
});


