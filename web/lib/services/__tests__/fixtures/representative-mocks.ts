/**
 * Test Fixtures - Representative Mock Data
 * 
 * Mock representatives for testing purposes only.
 * DO NOT use in production code.
 * 
 * Created: November 5, 2025
 * Purpose: Testing representative-related functionality
 */

import type { Representative } from '@/types/representative';

export const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 1,
    name: "Alexandria Ocasio-Cortez",
    party: "Democratic",
    office: "Representative",
    level: "federal",
    state: "NY",
    district: "14",
    primary_email: "aoc@mail.house.gov",
    primary_phone: "(202) 225-3965",
    primary_website: "https://ocasio-cortez.house.gov",
    twitter_handle: "AOC",
    facebook_url: "https://facebook.com/AlexandriaOcasioCortez",
    instagram_handle: "aoc",
    primary_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Alexandria_Ocasio-Cortez_Official_Portrait.jpg/330px-Alexandria_Ocasio-Cortez_Official_Portrait.jpg",
    data_quality_score: 95,
    verification_status: "verified",
    data_sources: ["congressGov", "googleCivic", "fec"],
    created_at: "2025-10-28T00:00:00Z",
    updated_at: "2025-10-28T00:00:00Z",
    last_verified: "2025-10-28T00:00:00Z",
    committees: [
      {
        id: 1,
        representative_id: 1,
        committee_name: "Financial Services",
        role: "member",
        is_current: true,
        created_at: "2025-10-28T00:00:00Z",
        updated_at: "2025-10-28T00:00:00Z"
      }
    ]
  },
  {
    id: 2,
    name: "Ted Cruz",
    party: "Republican",
    office: "Senator",
    level: "federal",
    state: "TX",
    primary_email: "ted.cruz@senate.gov",
    primary_phone: "(202) 224-5922",
    primary_website: "https://www.cruz.senate.gov",
    twitter_handle: "tedcruz",
    facebook_url: "https://facebook.com/SenatorTedCruz",
    primary_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Ted_Cruz%2C_Official_Portrait%2C_113th_Congress.jpg/330px-Ted_Cruz%2C_Official_Portrait%2C_113th_Congress.jpg",
    data_quality_score: 92,
    verification_status: "verified",
    data_sources: ["congressGov", "googleCivic", "fec"],
    created_at: "2025-10-28T00:00:00Z",
    updated_at: "2025-10-28T00:00:00Z",
    last_verified: "2025-10-28T00:00:00Z",
    committees: [
      {
        id: 2,
        representative_id: 2,
        committee_name: "Judiciary",
        role: "member",
        is_current: true,
        created_at: "2025-10-28T00:00:00Z",
        updated_at: "2025-10-28T00:00:00Z"
      }
    ]
  },
  {
    id: 3,
    name: "Gavin Newsom",
    party: "Democratic",
    office: "Governor",
    level: "state",
    state: "CA",
    primary_email: "governor@ca.gov",
    primary_phone: "(916) 445-2841",
    primary_website: "https://www.gov.ca.gov",
    twitter_handle: "GavinNewsom",
    facebook_url: "https://facebook.com/GavinNewsom",
    instagram_handle: "gavinnewsom",
    primary_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gavin_Newsom_2021.jpg/330px-Gavin_Newsom_2021.jpg",
    data_quality_score: 98,
    verification_status: "verified",
    data_sources: ["googleCivic", "openStatesApi"],
    created_at: "2025-10-28T00:00:00Z",
    updated_at: "2025-10-28T00:00:00Z",
    last_verified: "2025-10-28T00:00:00Z"
  }
];

/**
 * Get mock representative by ID
 */
export function getMockRepresentativeById(id: number): Representative | undefined {
  return MOCK_REPRESENTATIVES.find(rep => rep.id === id);
}

/**
 * Get mock representatives by state
 */
export function getMockRepresentativesByState(state: string): Representative[] {
  return MOCK_REPRESENTATIVES.filter(rep => rep.state === state);
}

/**
 * Get mock representatives by party
 */
export function getMockRepresentativesByParty(party: string): Representative[] {
  return MOCK_REPRESENTATIVES.filter(rep => rep.party === party);
}

/**
 * Get mock representatives by level
 */
export function getMockRepresentativesByLevel(level: string): Representative[] {
  return MOCK_REPRESENTATIVES.filter(rep => rep.level === level);
}

