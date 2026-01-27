import { formatRepresentativeLocation } from '@/features/civics/utils/formatRepresentativeLocation';

describe('formatRepresentativeLocation', () => {
  it('returns "City, ST • District X" when all fields present', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', district: '8' }),
    ).toBe('Sacramento, CA • District 8');
  });

  it('uses "—" for missing city', () => {
    expect(formatRepresentativeLocation({ state: 'CA', district: '8' })).toBe('—, CA • District 8');
  });

  it('uses "—" for missing district', () => {
    expect(formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento' })).toBe(
      'Sacramento, CA • —',
    );
  });

  it('uses "—" when both city and district missing', () => {
    expect(formatRepresentativeLocation({ state: 'CA' })).toBe('—, CA • —');
  });

  it('handles "at-large" district as "At-large"', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', district: 'at-large' }),
    ).toBe('Sacramento, CA • At-large');
  });

  it('trims whitespace', () => {
    expect(
      formatRepresentativeLocation({
        state: ' CA ',
        office_city: ' Sacramento ',
        district: ' 8 ',
      }),
    ).toBe('Sacramento, CA • District 8');
  });
});
