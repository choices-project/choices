import { formatRepresentativeLocation } from '@/features/civics/utils/formatRepresentativeLocation';

describe('formatRepresentativeLocation', () => {
  it('returns "City, ST • District X" when all fields present', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', district: '8' }),
    ).toBe('Sacramento, CA • District 8');
  });

  it('omits city when missing', () => {
    expect(formatRepresentativeLocation({ state: 'CA', district: '8' })).toBe('CA • District 8');
  });

  it('omits district when missing', () => {
    expect(formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento' })).toBe(
      'Sacramento, CA',
    );
  });

  it('returns state only when both city and district missing', () => {
    expect(formatRepresentativeLocation({ state: 'CA' })).toBe('CA');
  });

  it('handles "at-large" district as "At-large"', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', district: 'at-large' }),
    ).toBe('Sacramento, CA • At-large');
  });

  it('handles district "0" as "At-large"', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', district: '0' }),
    ).toBe('Sacramento, CA • At-large');
  });

  it('handles "District 0" as "At-large"', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', district: 'District 0' }),
    ).toBe('Sacramento, CA • At-large');
  });

  it('shows "Statewide" for senators', () => {
    expect(
      formatRepresentativeLocation({ state: 'CA', office_city: 'Sacramento', office: 'U.S. Senator' }),
    ).toBe('Sacramento, CA • Statewide');
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
