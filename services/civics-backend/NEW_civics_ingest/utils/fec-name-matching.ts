/**
 * Utilities for matching representative names to FEC candidate names.
 * 
 * FEC API stores names in various formats, and our database may have "Last, First" format.
 * This module provides functions to try multiple name format strategies.
 */

export interface NameVariants {
  original: string;
  lastFirst: string; // "Last, First"
  firstLast: string; // "First Last"
  lastName: string;
  firstName: string;
  withoutMiddleInitial: string;
  lastFirstNoMiddle: string;
  firstLastNoMiddle: string;
}

/**
 * Generate multiple name format variants for FEC API search
 */
export function generateNameVariants(name: string): NameVariants {
  const original = name.trim();
  
  // Check if it's "Last, First" format
  if (original.includes(',')) {
    const parts = original.split(',').map(s => s.trim());
    const last = parts[0];
    const first = parts.slice(1).join(' ').trim();
    
    // Remove middle initials (single letters with periods, e.g., "S.", "C.")
    const firstNoMiddle = first.replace(/\b[A-Z]\.\s*/g, '').trim();
    const lastNoMiddle = last.replace(/\b[A-Z]\.\s*/g, '').trim();
    
    return {
      original,
      lastFirst: original, // Already in this format
      firstLast: `${first} ${last}`.trim(),
      lastName: last,
      firstName: first,
      withoutMiddleInitial: `${firstNoMiddle} ${lastNoMiddle}`.trim(),
      lastFirstNoMiddle: `${lastNoMiddle}, ${firstNoMiddle}`.trim(),
      firstLastNoMiddle: `${firstNoMiddle} ${lastNoMiddle}`.trim(),
    };
  }
  
  // Assume "First Last" format
  const parts = original.split(/\s+/);
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  
  // Remove middle initials
  const firstNoMiddle = first.replace(/\b[A-Z]\.\s*/g, '').trim();
  const lastNoMiddle = last.replace(/\b[A-Z]\.\s*/g, '').trim();
  
  return {
    original,
    lastFirst: `${last}, ${first}`,
    firstLast: original,
    lastName: last,
    firstName: first,
    withoutMiddleInitial: `${firstNoMiddle} ${lastNoMiddle}`,
    lastFirstNoMiddle: `${lastNoMiddle}, ${firstNoMiddle}`,
    firstLastNoMiddle: `${firstNoMiddle} ${lastNoMiddle}`,
  };
}

/**
 * Generate search strategies for FEC API, ordered by likelihood of success
 */
export function generateSearchStrategies(
  name: string,
  office?: 'H' | 'S' | 'P',
  state?: string,
  district?: string | null,
): Array<{ name: string; office?: 'H' | 'S' | 'P'; state?: string; district?: string }> {
  const variants = generateNameVariants(name);
  const strategies: Array<{ name: string; office?: 'H' | 'S' | 'P'; state?: string; district?: string }> = [];
  
  // Strategy 1: Original name with all filters (most specific)
  strategies.push({
    name: variants.original,
    office,
    state,
    ...(district && office === 'H' ? { district } : {}),
  });
  
  // Strategy 2: First Last format with all filters
  if (variants.firstLast !== variants.original) {
    strategies.push({
      name: variants.firstLast,
      office,
      state,
      ...(district && office === 'H' ? { district } : {}),
    });
  }
  
  // Strategy 3: Without middle initial, with all filters
  if (variants.withoutMiddleInitial !== variants.original && variants.withoutMiddleInitial !== variants.firstLast) {
    strategies.push({
      name: variants.withoutMiddleInitial,
      office,
      state,
      ...(district && office === 'H' ? { district } : {}),
    });
  }
  
  // Strategy 4: Last, First format with all filters
  if (variants.lastFirst !== variants.original) {
    strategies.push({
      name: variants.lastFirst,
      office,
      state,
      ...(district && office === 'H' ? { district } : {}),
    });
  }
  
  // Strategy 5: Last, First without middle initial
  if (variants.lastFirstNoMiddle !== variants.original && variants.lastFirstNoMiddle !== variants.lastFirst) {
    strategies.push({
      name: variants.lastFirstNoMiddle,
      office,
      state,
      ...(district && office === 'H' ? { district } : {}),
    });
  }
  
  // Strategy 6: First Last without middle initial
  if (variants.firstLastNoMiddle !== variants.original && variants.firstLastNoMiddle !== variants.firstLast) {
    strategies.push({
      name: variants.firstLastNoMiddle,
      office,
      state,
      ...(district && office === 'H' ? { district } : {}),
    });
  }
  
  // Strategy 7: Last name only with office and state (broader search)
  strategies.push({
    name: variants.lastName,
    office,
    state,
  });
  
  // Strategy 8: Original name with office only (no state)
  strategies.push({
    name: variants.original,
    office,
  });
  
  // Strategy 9: First Last with office only
  if (variants.firstLast !== variants.original) {
    strategies.push({
      name: variants.firstLast,
      office,
    });
  }
  
  // Strategy 10: Last name only with office (no state)
  strategies.push({
    name: variants.lastName,
    office,
  });
  
  // Remove duplicates
  const seen = new Set<string>();
  return strategies.filter(strategy => {
    const key = JSON.stringify(strategy);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Match a representative to FEC candidate by trying multiple search strategies
 */
export async function findFecCandidateByMultipleStrategies(
  searchFn: (params: { name: string; office?: 'H' | 'S' | 'P'; state?: string; district?: string; per_page?: number }) => Promise<Array<{ candidate_id: string; name: string; office?: string; state?: string; district?: string; district_number?: number }>>,
  name: string,
  office?: 'H' | 'S' | 'P',
  state?: string,
  district?: string | null,
): Promise<{ candidate_id: string; name: string } | null> {
  const strategies = generateSearchStrategies(name, office, state, district);
  
  for (const strategy of strategies) {
    try {
      const candidates = await searchFn({
        name: strategy.name,
        office: strategy.office,
        state: strategy.state,
        district: strategy.district,
        per_page: 20, // Get more results to improve matching
      });
      
      if (candidates.length > 0) {
        // If we have office/state/district filters, try to match more precisely
        if (strategy.office && strategy.state) {
          // Prefer exact matches on office and state
          let exactMatch = candidates.find(c => 
            c.office === strategy.office && 
            c.state === strategy.state?.toUpperCase()
          );
          
          // If we have district, prefer exact district match
          if (strategy.district && exactMatch) {
            const districtNum = parseInt(strategy.district, 10);
            const exactDistrictMatch = candidates.find(c => 
              c.office === strategy.office && 
              c.state === strategy.state?.toUpperCase() &&
              (c.district === strategy.district || 
               (districtNum && c.district_number === districtNum) ||
               (c.district && parseInt(c.district, 10) === districtNum))
            );
            if (exactDistrictMatch) {
              return { candidate_id: exactDistrictMatch.candidate_id, name: exactDistrictMatch.name };
            }
          }
          
          if (exactMatch) {
            return { candidate_id: exactMatch.candidate_id, name: exactMatch.name };
          }
        }
        
        // Return first match if no exact match found
        return { candidate_id: candidates[0].candidate_id, name: candidates[0].name };
      }
    } catch (error) {
      // Continue to next strategy on error
      continue;
    }
  }
  
  return null;
}
