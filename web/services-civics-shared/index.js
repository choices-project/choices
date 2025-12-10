const KEYWORD_SUBJECTS = {
  Healthcare: ['health', 'medicaid', 'medicare', 'hospital', 'insurance'],
  Education: ['education', 'school', 'teacher', 'student'],
  Housing: ['housing', 'rent', 'mortgage', 'zoning', 'homeless'],
  Economy: ['economic', 'tax', 'business', 'commerce', 'jobs', 'wage'],
  Climate: ['climate', 'environment', 'energy', 'carbon', 'emissions'],
  Security: ['security', 'police', 'public safety', 'firearm', 'crime'],
  Transportation: ['transport', 'infrastructure', 'road', 'transit', 'traffic'],
};

export function extractDivisionMetadata(divisionId, fallbackState) {
  if (!divisionId) {
    const result = {
      jurisdiction: fallbackState ?? 'US',
    };
    if (fallbackState) {
      result.stateCode = fallbackState.toUpperCase();
    }
    return result;
  }

  const stateMatch = divisionId.match(/state:([a-z]{2})/i);
  const districtMatch = divisionId.match(/(?:cd|sldl|sldu):([a-z0-9]+)/i);
  const countyMatch = divisionId.match(/county:([a-z_]+)/i);
  const localityMatch = divisionId.match(/place:([a-z_]+)/i);

  const stateCode = stateMatch?.[1]?.toUpperCase() ?? (fallbackState ? fallbackState.toUpperCase() : undefined);
  const district = districtMatch?.[1]?.toUpperCase();

  const jurisdictionSegments = [
    'ocd-division',
    stateCode ? `state:${stateCode}` : null,
    countyMatch ? `county:${countyMatch[1]}` : null,
    localityMatch ? `locality:${localityMatch[1]}` : null,
    district ? `district:${district}` : null,
  ].filter(Boolean);

  const result = {
    jurisdiction: jurisdictionSegments.join('/'),
  };

  if (stateCode) {
    result.stateCode = stateCode;
  }
  if (district) {
    result.district = district;
  }

  return result;
}

export function determineRaceImportance(electionName, jurisdiction) {
  const normalizedName = (electionName ?? '').toLowerCase();

  if (
    normalizedName.includes('presidential') ||
    normalizedName.includes('general') ||
    normalizedName.includes('federal')
  ) {
    return 'high';
  }

  if (normalizedName.includes('primary') || normalizedName.includes('statewide')) {
    return 'medium';
  }

  if ((jurisdiction ?? '').toLowerCase().includes('municipal')) {
    return 'low';
  }

  return 'medium';
}

export function estimateDeadline(dateString, offsetDays) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const adjusted = new Date(date);
  adjusted.setUTCDate(date.getUTCDate() - offsetDays);
  return adjusted.toISOString().slice(0, 10);
}

export function buildLookupAddress(location) {
  if (!location || typeof location !== 'object') {
    return null;
  }

  if (location.address) {
    return location.address;
  }

  const segments = [];
  if (location.city) {
    segments.push(location.city);
  }
  if (location.stateCode) {
    segments.push(location.stateCode);
  }
  if (location.zipCode) {
    segments.push(location.zipCode);
  }

  if (segments.length > 0) {
    return segments.join(', ');
  }

  if (location.coordinates && typeof location.coordinates.lat === 'number' && typeof location.coordinates.lng === 'number') {
    return `${location.coordinates.lat}, ${location.coordinates.lng}`;
  }

  return null;
}

export function deriveSubjectsFromTitle(title) {
  const normalized = (title ?? '').toLowerCase();
  const subjects = [];

  for (const [subject, terms] of Object.entries(KEYWORD_SUBJECTS)) {
    if (terms.some((term) => normalized.includes(term))) {
      subjects.push(subject);
    }
  }

  if (subjects.length === 0 && title) {
    subjects.push(title.split(' ')[0] ?? 'General');
  }

  return subjects;
}

export function getMostRecentActionDate(bill) {
  if (!bill) {
    return undefined;
  }

  const actionDates = Array.isArray(bill.actions)
    ? bill.actions
        .map((action) => action?.date)
        .filter((date) => Boolean(date))
    : [];

  if (bill.latest_action) {
    actionDates.push(bill.latest_action);
  }
  if (bill.updated_at) {
    actionDates.push(bill.updated_at);
  }

  if (actionDates.length === 0) {
    return undefined;
  }

  const timestamps = actionDates
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...timestamps.map((date) => date.getTime()))).toISOString();
}

export function deriveKeyIssuesFromBills(bills, options = {}) {
  const limit = typeof options.limit === 'number' ? options.limit : 8;
  const source = options.source ?? 'openstates';

  const issueCounts = new Map();

  (bills ?? []).forEach((bill) => {
    const subjects = [...(bill?.subjects ?? [])];
    const latestAction = getMostRecentActionDate(bill);

    if (subjects.length === 0 && bill?.title) {
      subjects.push(...deriveSubjectsFromTitle(bill.title));
    }

    subjects
      .map((subject) => subject?.trim())
      .filter(Boolean)
      .forEach((subject) => {
        const existing = issueCounts.get(subject);
        if (existing) {
          existing.mentions += 1;
          if (latestAction && (!existing.latestAction || new Date(latestAction) > new Date(existing.latestAction))) {
            existing.latestAction = latestAction;
          }
        } else {
          issueCounts.set(subject, latestAction ? { mentions: 1, latestAction } : { mentions: 1 });
        }
      });
  });

  const issues = Array.from(issueCounts.entries())
    .sort((a, b) => {
      if (b[1].mentions !== a[1].mentions) {
        return b[1].mentions - a[1].mentions;
      }

      const dateA = a[1].latestAction ? new Date(a[1].latestAction).getTime() : 0;
      const dateB = b[1].latestAction ? new Date(b[1].latestAction).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit)
    .map(([issue, data]) => {
      const entry = {
        issue,
        mentions: data.mentions,
        source,
      };

      if (data.latestAction) {
        entry.latestAction = data.latestAction;
      }

      return entry;
    });

  return issues;
}

export function determineOfficeCode(officeName) {
  if (!officeName) {
    return null;
  }

  const normalized = officeName.toLowerCase();

  if (normalized.includes('house')) {
    return 'H';
  }

  if (normalized.includes('senate')) {
    return 'S';
  }

  if (normalized.includes('president')) {
    return 'P';
  }

  return null;
}

export function normalizeDistrict(district) {
  if (!district) {
    return undefined;
  }

  const match = district.match(/\d+/);
  if (!match?.[0]) {
    return undefined;
  }

  return match[0].padStart(2, '0');
}

export function getCurrentFecCycle(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  return year % 2 === 0 ? year : year + 1;
}

export function calculateCashOnHand(finance) {
  if (
    !finance ||
    finance.totalRaised === null ||
    finance.totalRaised === undefined ||
    finance.totalSpent === null ||
    finance.totalSpent === undefined
  ) {
    return null;
  }

  const cash = finance.totalRaised - finance.totalSpent;
  if (Number.isNaN(cash)) {
    return null;
  }

  return Math.max(Math.round(cash), 0);
}

export function formatCurrency(value) {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function describeFinanceSummary(summary, cycle) {
  const raised = formatCurrency(summary?.totalRaised ?? null);
  const spent = formatCurrency(summary?.totalSpent ?? null);

  const smallDonors =
    summary?.smallDonorPercentage !== null && summary?.smallDonorPercentage !== undefined
      ? `${summary.smallDonorPercentage.toFixed(1)}% small donors`
      : 'Small donor data unavailable';

  return `Cycle ${cycle}: raised ${raised}, spent ${spent}. ${smallDonors}.`;
}

export function resolveLastFilingDate(finance, candidate) {
  if (finance && typeof finance === 'object' && finance.lastUpdated) {
    return finance.lastUpdated;
  }

  if (candidate?.last_file_date) {
    return candidate.last_file_date;
  }

  if (candidate?.last_f2_date) {
    return candidate.last_f2_date;
  }

  return null;
}

export function buildCampaignActivity(candidates, cycle, now = new Date()) {
  return (candidates ?? [])
    .filter((candidate) => candidate && candidate.lastFilingDate)
    .slice(0, 3)
    .map((candidate) => {
      const date = candidate.lastFilingDate ?? now.toISOString();

      return {
        id: `${candidate.candidateId}-filing-${date}`,
        type: 'event',
        title: `${candidate.name} filed an FEC report`,
        description: describeFinanceSummary(candidate, cycle),
        date,
        source: 'fec',
      };
    });
}

export function createCampaignDataFallback(raceId, now = new Date()) {
  return {
    source: 'placeholder',
    fetchedAt: now.toISOString(),
    cycle: null,
    candidates: [],
    recentActivity: [],
    constituentQuestions: 0,
    candidateResponses: 0,
  };
}

