export const CIVICS_ADDRESS_LOOKUP = {
  jurisdiction: {
    district: '13',
    state: 'IL',
    county: 'Sangamon',
    fallback: false,
  },
  normalizedInput: {
    line1: '123 Any St',
    city: 'Springfield',
    state: 'IL',
    zip: '62704',
  },
};

export const CIVICS_STATE_FIXTURE = {
  state: 'IL',
  level: 'federal',
  count: 1,
  representatives: [
    {
      id: 'rep-1',
      name: 'Representative Example',
      office: 'House',
      level: 'federal',
      jurisdiction: 'IL',
      party: 'Independent',
      last_updated: new Date().toISOString(),
    },
  ],
};

